const DATA_PATH='../../data/hotel_bookings.csv';
let rawData=[];
let resizeTimer=null;
let scatterZoomTransform=d3.zoomIdentity;

const COLORS={
  city:'#8EC5FC',
  resort:'#B8A4E8',
  primary:'#8EC5FC',

  notCanceled:'#8DD3C7',
  canceled:'#FF9AA2',

  noDeposit:'#8EC5FC',
  refundable:'#FFD166',
  nonRefund:'#F4A6C8',

  direct:'#8EC5FC',
  corporate:'#B8A4E8',
  onlineTA:'#A8D8EA',
  offlineTA:'#C7CEEA',
  complementary:'#B5EAD7',
  groups:'#FFD6A5',
  aviation:'#FFDAC1',

  rf:'#8EC5FC',
  lr:'#B8A4E8',

  text:'#64859a',
  grid:'#eef6fa'
};

const palette=[
  '#8EC5FC',
  '#B8A4E8',
  '#A8D8EA',
  '#B5EAD7',
  '#FFD6A5',
  '#FFDAC1',
  '#F4A6C8',
  '#C7CEEA'
];

const $=id=>document.getElementById(id);
const fmt=n=>Number(n||0).toLocaleString('en-US');
const pct=n=>`${Number(n||0).toFixed(1)}%`;

function parseRow(r){
  return {
    hotel:r.hotel,
    is_canceled:+r.is_canceled,
    lead_time:+r.lead_time,
    adr:+r.adr,
    deposit_type:r.deposit_type,
    market_segment:r.market_segment,
    total_of_special_requests:+r.total_of_special_requests
  };
}
function uniqueSorted(key){
  return [...new Set(rawData.map(d=>d[key]).filter(v=>v!==undefined&&v!==''))].sort((a,b)=>{
    const na=Number(a),nb=Number(b); return Number.isFinite(na)&&Number.isFinite(nb)?na-nb:String(a).localeCompare(String(b));
  });
}
function fillSelect(id,key,formatter=x=>x){
  const el=$(id), old=el.value;
  el.innerHTML='<option value="All">ทั้งหมด</option>';
  uniqueSorted(key).forEach(v=>{const o=document.createElement('option');o.value=String(v);o.textContent=formatter(v);el.appendChild(o)});
  if([...el.options].some(o=>o.value===old))el.value=old;
}
function initFilters(){
  fillSelect('globalHotel','hotel');
  fillSelect('globalDeposit','deposit_type');
  fillSelect('globalRequests','total_of_special_requests',v=>String(v));
  fillSelect('globalSegment','market_segment');
}
function getFilteredData(){
  const h=$('globalHotel').value,s=$('globalStatus').value,d=$('globalDeposit').value,r=$('globalRequests').value,m=$('globalSegment').value;
  return rawData.filter(x=>(h==='All'||x.hotel===h)&&(s==='All'||String(x.is_canceled)===s)&&(d==='All'||x.deposit_type===d)&&(r==='All'||String(x.total_of_special_requests)===r)&&(m==='All'||x.market_segment===m));
}
function setTitle(titleId,descId,title,desc){$(titleId).textContent=title;$(descId).textContent=desc}
function colorFor(label,index=0){
  const s=String(label);
  if(s==='City Hotel')return COLORS.city;if(s==='Resort Hotel')return COLORS.resort;
  if(s==='ไม่ยกเลิก'||s==='Not Canceled')return COLORS.notCanceled;if(s==='ยกเลิก'||s==='Canceled')return COLORS.canceled;
  if(s==='No Deposit')return COLORS.noDeposit;if(s==='Refundable')return COLORS.refundable;if(s==='Non Refund'||s==='Non Refundable')return COLORS.nonRefund;
  return palette[index%palette.length];
}
function svgSize(container){const r=container.getBoundingClientRect();return {width:Math.max(100,r.width),height:Math.max(180,r.height)}}
function clearChart(id){const c=$(id);c.innerHTML='';return c}
function tipRow(color,label,value){return `<div class="d3-tip-row"><span class="d3-tip-swatch" style="background:${color}"></span>${label?`<span>${label}</span>`:''}<strong>${value}</strong></div>`}
function showTip(title,rows,event){let t=document.querySelector('.d3-tooltip-global');if(!t){t=document.createElement('div');t.className='d3-tooltip d3-tooltip-global';document.body.appendChild(t)}t.innerHTML=`<div class="d3-tip-title">${title}</div>${rows.join('')}`;t.style.display='block';moveTip(event)}
function moveTip(event){const t=document.querySelector('.d3-tooltip-global');if(!t||!event)return;const pad=14;let left=event.clientX+pad,top=event.clientY+pad;const rect=t.getBoundingClientRect();if(left+rect.width>window.innerWidth-8)left=event.clientX-rect.width-pad;if(top+rect.height>window.innerHeight-8)top=event.clientY-rect.height-pad;if(top<8)top=8;if(left<8)left=8;t.style.left=left+'px';t.style.top=top+'px'}
function hideTip(){const t=document.querySelector('.d3-tooltip-global');if(t)t.style.display='none'}

function updateKPIs(){
  const d=getFilteredData();const canceled=d.filter(x=>x.is_canceled===1).length;const adr=d.length?d.reduce((s,x)=>s+(Number.isFinite(x.adr)?x.adr:0),0)/d.length:0;
  $('kpiTotal').textContent=fmt(d.length);$('kpiCanceled').textContent=fmt(canceled);$('kpiRate').textContent=pct(d.length?canceled/d.length*100:0);$('kpiAdr').textContent='$'+adr.toFixed(2);
}

function hoverDim(selection, baseOpacity=0.82){
  selection.on('mouseenter',function(){
    selection.attr('opacity',0.22);
    d3.select(this).attr('opacity',1);
  }).on('mouseleave',function(){
    selection.attr('opacity',baseOpacity);
    hideTip();
  });
}

function renderBar(){
  const c=clearChart('barChart'),d=getFilteredData(),group=$('barGroupSelect').value;
  const config={
    hotel:['ประเภทโรงแรม','Booking ที่ยกเลิกและไม่ยกเลิก แยกตามประเภทโรงแรม','เปรียบเทียบ Cancelled กับ Not Cancelled ในแต่ละประเภทโรงแรม'],
    market_segment:['กลุ่มตลาด','Booking ที่ยกเลิกและไม่ยกเลิก แยกตามกลุ่มตลาด','เปรียบเทียบ Cancelled กับ Not Cancelled ในแต่ละกลุ่มตลาด'],
    deposit_type:['ประเภทมัดจำ','Booking ที่ยกเลิกและไม่ยกเลิก แยกตามประเภทมัดจำ','เปรียบเทียบ Cancelled กับ Not Cancelled ในแต่ละประเภทมัดจำ'],
    total_of_special_requests:['จำนวนคำขอพิเศษ','Booking ที่ยกเลิกและไม่ยกเลิก แยกตามจำนวนคำขอพิเศษ','เปรียบเทียบ Cancelled กับ Not Cancelled ตามจำนวนคำขอพิเศษ']
  }[group];
  setTitle('barTitle','barDesc',config[1],config[2]);

  const map=new Map();
  d.forEach(x=>{
    const k=String(x[group]);
    if(!map.has(k))map.set(k,{label:k,notCanceled:0,canceled:0});
    const row=map.get(k);
    if(x.is_canceled===1)row.canceled++;else row.notCanceled++;
  });
  const rows=[...map.values()].sort((a,b)=>(b.canceled+b.notCanceled)-(a.canceled+a.notCanceled));

  const {width,height}=svgSize(c),m={top:25,right:20,bottom:48,left:58};
  const svg=d3.select(c).append('svg').attr('viewBox',`0 0 ${width} ${height}`);
  const x0=d3.scaleBand().domain(rows.map(v=>v.label)).range([m.left,width-m.right]).padding(.22);
  const x1=d3.scaleBand().domain(['notCanceled','canceled']).range([0,x0.bandwidth()]).padding(.14);
  const max=Math.max(1,d3.max(rows,v=>Math.max(v.notCanceled,v.canceled))||1);
  const y=d3.scaleLinear().domain([0,max*1.15]).nice().range([height-m.bottom,m.top]);

  svg.append('g').attr('class','grid').attr('transform',`translate(${m.left},0)`)
    .call(d3.axisLeft(y).ticks(6).tickSize(-(width-m.left-m.right)).tickFormat(''));
  svg.append('g').attr('class','axis').attr('transform',`translate(0,${height-m.bottom})`)
    .call(d3.axisBottom(x0).tickSize(0));
  svg.append('g').attr('class','axis').attr('transform',`translate(${m.left},0)`)
    .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(',')));

  const series=[
    {key:'notCanceled',label:'ไม่ยกเลิก',color:COLORS.notCanceled},
    {key:'canceled',label:'ยกเลิก',color:COLORS.canceled}
  ];
  const groups=svg.append('g').selectAll('.bar-group').data(rows).join('g')
    .attr('transform',v=>`translate(${x0(v.label)},0)`);

  const bars=groups.selectAll('rect').data(v=>series.map(s=>({
    category:v.label,key:s.key,label:s.label,color:s.color,value:v[s.key]
  }))).join('rect')
    .attr('x',v=>x1(v.key)).attr('width',x1.bandwidth())
    .attr('y',height-m.bottom).attr('height',0).attr('rx',8)
    .attr('fill',v=>v.color).attr('opacity',.88).style('cursor','pointer');

  bars.on('mouseenter',function(e,v){
    bars.attr('opacity',.18);d3.select(this).attr('opacity',1);
    const row=rows.find(r=>r.label===v.category)||{notCanceled:0,canceled:0};
    const total=row.notCanceled+row.canceled;
    showTip(v.category,[
      tipRow(COLORS.notCanceled,'ไม่ยกเลิก',`${fmt(row.notCanceled)} Booking`),
      tipRow(COLORS.canceled,'ยกเลิก',`${fmt(row.canceled)} Booking`),
      tipRow(COLORS.canceled,'Cancellation Rate',pct(total?row.canceled/total*100:0))
    ],e);
  }).on('mousemove',e=>moveTip(e)).on('mouseleave',function(){bars.attr('opacity',.88);hideTip()});

  /* ===== Value labels on bars ===== */
const valueLabels = groups.selectAll('.bar-value')
  .data(v => series.map(s => ({
    category: v.label,
    key: s.key,
    value: v[s.key]
  })))
  .join('text')
  .attr('class', 'bar-value')
  .attr('x', v => x1(v.key) + x1.bandwidth() / 2)
  .attr('y', height - m.bottom - 6)
  .attr('text-anchor', 'middle')
  .attr('fill', '#52758a')
  .attr('font-family', '"Mali", sans-serif')
  .attr('font-size', '9px')
  .attr('font-weight', '600')
  .attr('opacity', 0)
  .text(v => fmt(v.value));
 
/* ===== Bar animation + number animation ===== */
bars.transition()
  .duration(1800)
  .ease(d3.easeCubicInOut)
  .delay((v, i) => i * 120)
  .attr('y', v => y(v.value))
  .attr('height', v => height - m.bottom - y(v.value));
 
valueLabels.transition()
  .duration(1800)
  .ease(d3.easeCubicInOut)
  .delay((v, i) => i * 120)
  .attr('y', v => y(v.value) - 7)
  .attr('opacity', 1);

  $('barLegend').innerHTML=series.map(s=>`<span class="legend-pill"><i class="legend-dot" style="background:${s.color}"></i>${s.label}</span>`).join('');
}


function leadRows(d){
  const ranges=[['0–7 วัน',0,7],['8–30 วัน',8,30],['31–60 วัน',31,60],['61–90 วัน',61,90],['91–180 วัน',91,180],['181–365 วัน',181,365],['366+ วัน',366,Infinity]];
  return ranges.map(([label,min,max])=>{
    const a=d.filter(x=>x.lead_time>=min&&x.lead_time<=max);
    const nc=a.filter(x=>x.is_canceled===0),c=a.filter(x=>x.is_canceled===1);
    return {
      label,
      notCanceledBookings:nc.length,
      canceledBookings:c.length,
      notCanceledAdr:nc.length?nc.reduce((s,x)=>s+x.adr,0)/nc.length:0,
      canceledAdr:c.length?c.reduce((s,x)=>s+x.adr,0)/c.length:0,
      cancelRate:a.length?c.length/a.length*100:0
    };
  });
}



function renderLine(){
  const c=clearChart('lineChart'),d=getFilteredData(),metric=$('lineMetricSelect').value,rows=leadRows(d);
  const isAdr=metric==='adr',isRate=metric==='cancelRate';
  const title=isAdr?'ADR ตามช่วง Lead Time':isRate?'อัตราการยกเลิกตามช่วง Lead Time':'Cancelled vs Not Cancelled ตามช่วง Lead Time';
  const desc=isAdr?'เปรียบเทียบราคาเฉลี่ยต่อคืนของ Booking ที่ยกเลิกและไม่ยกเลิกในแต่ละช่วง Lead Time':
    isRate?'แสดงสัดส่วน Booking ที่ยกเลิกในแต่ละช่วง Lead Time':
    'เปรียบเทียบจำนวน Booking ที่ยกเลิกและไม่ยกเลิกในแต่ละช่วง Lead Time';
  setTitle('lineTitle','lineDesc',title,desc);

  const series=isRate
    ?[{key:'cancelRate',label:'อัตราการยกเลิก',color:COLORS.canceled,fmt:v=>`${v.toFixed(1)}%`}]
    :isAdr
      ?[{key:'notCanceledAdr',label:'ไม่ยกเลิก',color:COLORS.notCanceled,fmt:v=>`$${v.toFixed(2)}`},
        {key:'canceledAdr',label:'ยกเลิก',color:COLORS.canceled,fmt:v=>`$${v.toFixed(2)}`}]
      :[{key:'notCanceledBookings',label:'ไม่ยกเลิก',color:COLORS.notCanceled,fmt:v=>`${fmt(v)} Booking`},
        {key:'canceledBookings',label:'ยกเลิก',color:COLORS.canceled,fmt:v=>`${fmt(v)} Booking`}];

  const {width,height}=svgSize(c),m={top:25,right:20,bottom:44,left:58};
  const svg=d3.select(c).append('svg').attr('viewBox',`0 0 ${width} ${height}`);
  const x=d3.scalePoint().domain(rows.map(v=>v.label)).range([m.left,width-m.right]);
  const allVals=series.flatMap(s=>rows.map(v=>v[s.key]));
  const max=Math.max(1,d3.max(allVals)||1);
  const y=d3.scaleLinear().domain([0,max*1.12]).nice().range([height-m.bottom,m.top]);

  svg.append('g').attr('class','grid').attr('transform',`translate(${m.left},0)`)
    .call(d3.axisLeft(y).ticks(5).tickSize(-(width-m.left-m.right)).tickFormat(''));
  svg.append('g').attr('class','axis').attr('transform',`translate(0,${height-m.bottom})`)
    .call(d3.axisBottom(x).tickSize(0));
  svg.append('g').attr('class','axis').attr('transform',`translate(${m.left},0)`)
    .call(d3.axisLeft(y).ticks(5).tickFormat(v=>isAdr?'$'+v:isRate?v+'%':d3.format(',')(v)));

  const defs=svg.append('defs');
  series.forEach((s,i)=>{
    const grad=defs.append('linearGradient').attr('id',`d3LineGradCancel${i}`).attr('x1','0').attr('y1','0').attr('x2','0').attr('y2','1');
    grad.append('stop').attr('offset','0%').attr('stop-color',s.color).attr('stop-opacity',.20);
    grad.append('stop').attr('offset','100%').attr('stop-color',s.color).attr('stop-opacity',.015);
  });

  series.forEach((s,si)=>{
    const area=d3.area().x(v=>x(v.label)).y0(height-m.bottom).y1(v=>y(v[s.key])).curve(d3.curveMonotoneX);
    const line=d3.line().x(v=>x(v.label)).y(v=>y(v[s.key])).curve(d3.curveMonotoneX);
    const areaPath=svg.append('path').datum(rows).attr('d',area).attr('fill',`url(#d3LineGradCancel${si})`).attr('opacity',0);
    areaPath.transition().duration(1200).delay(si*180).ease(d3.easeCubicInOut).attr('opacity',1);
    const p=svg.append('path').datum(rows).attr('d',line).attr('fill','none').attr('stroke',s.color).attr('stroke-width',3).attr('stroke-linecap','round').attr('stroke-linejoin','round');
    const len=p.node().getTotalLength();
    p.attr('stroke-dasharray',`${len} ${len}`).attr('stroke-dashoffset',len)
      .transition().duration(1800).delay(si*150).ease(d3.easeCubicInOut).attr('stroke-dashoffset',0);
    const points=svg.append('g').selectAll(`.line-p-${si}`).data(rows).join('circle')
      .attr('cx',v=>x(v.label)).attr('cy',height-m.bottom).attr('r',4.5)
      .attr('fill','#fff').attr('stroke',s.color).attr('stroke-width',2.5).attr('opacity',0).style('cursor','pointer');
    points.on('mouseenter',function(e,v){
      points.attr('opacity',.18);d3.select(this).attr('opacity',1).attr('r',7);
      const rowsTip=series.map(q=>tipRow(q.color,q.label,q.fmt(v[q.key])));
      showTip(v.label,rowsTip,e);
    }).on('mousemove',e=>moveTip(e)).on('mouseleave',function(){points.attr('opacity',.95);d3.select(this).attr('r',4.5);hideTip()});
    points.transition().duration(1400).ease(d3.easeCubicInOut).delay((v,i)=>i*150+si*100)
      .attr('cy',v=>y(v[s.key])).attr('opacity',.95);
  });

  $('lineLegend').innerHTML=series.map(s=>`<span class="legend-pill"><i class="legend-dot" style="background:${s.color}"></i>${s.label}</span>`).join('');
}


function renderDonut(){
  const c=clearChart('donutChart'),d=getFilteredData(),view=$('donutViewSelect').value;let labels=[],values=[];
  if(view==='status'){labels=['ไม่ยกเลิก','ยกเลิก'];values=[d.filter(x=>x.is_canceled===0).length,d.filter(x=>x.is_canceled===1).length]}
  else if(view==='hotel'){labels=['City Hotel','Resort Hotel'];values=[d.filter(x=>x.hotel==='City Hotel').length,d.filter(x=>x.hotel==='Resort Hotel').length]}
  else {const m={};d.forEach(x=>m[x.deposit_type]=(m[x.deposit_type]||0)+1);labels=Object.keys(m);values=Object.values(m)}
  const viewLabel=view==='status'?'สถานะการจอง':view==='hotel'?'ประเภทโรงแรม':'ประเภทมัดจำ';setTitle('donutTitle','donutDesc',`สัดส่วน${viewLabel}`,`วงแหวนแสดงสัดส่วน${viewLabel} ของ Booking`);
  const {width,height}=svgSize(c),r=Math.min(width,height)/2-15;const svg=d3.select(c).append('svg').attr('viewBox',`0 0 ${width} ${height}`).append('g').attr('transform',`translate(${width/2},${height/2})`);
  const data=labels.map((label,i)=>({label,value:values[i],color:colorFor(label,i)}));const pie=d3.pie().value(v=>v.value).sort(null);const arc=d3.arc().innerRadius(r*.68).outerRadius(r);const hoverArc=d3.arc().innerRadius(r*.68).outerRadius(r+9);
  const arcs=svg.selectAll('path').data(pie(data)).join('path').attr('fill',v=>v.data.color).attr('stroke','#fff').attr('stroke-width',5).attr('opacity',.92).each(function(){this._current={startAngle:0,endAngle:0}}).style('cursor','pointer');
  arcs.on('mouseenter',function(e,v){arcs.attr('opacity',.22);d3.select(this).attr('opacity',1).attr('d',hoverArc(v));showTip(v.data.label,[tipRow(v.data.color,'',`${fmt(v.data.value)} Booking`),tipRow(v.data.color,'สัดส่วน',`${((v.data.value/(d.length||1))*100).toFixed(1)}%`)],e)}).on('mousemove',(e)=>moveTip(e)).on('mouseleave',function(e,v){arcs.attr('opacity',.92);d3.select(this).attr('d',arc(v));hideTip()});
  arcs.transition().duration(1900).ease(d3.easeCubicOut).attrTween('d',function(v){const i=d3.interpolate(this._current,v);this._current=i(1);return t=>arc(i(t))});
  svg.append('text').attr('text-anchor','middle').attr('dy','-5').attr('fill','#426b82').attr('font-size','22px').attr('font-weight','700').text(fmt(d.length));
  svg.append('text').attr('text-anchor','middle').attr('dy','16').attr('fill','#8aa1af').attr('font-size','10px').text('Booking ทั้งหมด');
  $('donutLegend').innerHTML=data.map(v=>`<span class="legend-pill"><i class="legend-dot" style="background:${v.color}"></i>${v.label} · ${fmt(v.value)}</span>`).join('');
}

function renderScatter(){
  const c=clearChart('scatterChart'),d=getFilteredData().filter(x=>Number.isFinite(x.lead_time)&&Number.isFinite(x.adr)),by=$('scatterColorSelect').value;
  const defs=by==='hotel'?[['City Hotel',x=>x.hotel==='City Hotel',COLORS.city],['Resort Hotel',x=>x.hotel==='Resort Hotel',COLORS.resort]]:by==='status'?[['ไม่ยกเลิก',x=>x.is_canceled===0,COLORS.notCanceled],['ยกเลิก',x=>x.is_canceled===1,COLORS.canceled]]:[['No Deposit',x=>x.deposit_type==='No Deposit',COLORS.noDeposit],['Refundable',x=>x.deposit_type==='Refundable',COLORS.refundable],['Non Refund',x=>x.deposit_type==='Non Refund'||x.deposit_type==='Non Refundable',COLORS.nonRefund]];
  const sampled=d.length>2200?d.filter((_,i)=>i%Math.ceil(d.length/2200)===0):d;const byLabel=by==='hotel'?'ประเภทโรงแรม':by==='status'?'สถานะการจอง':'ประเภทมัดจำ';
  setTitle('scatterTitle','scatterDesc',`ความสัมพันธ์ระหว่าง Lead Time กับ ADR — สีตาม${byLabel}`,`แต่ละจุดแทน Booking และใช้สีแยกตาม${byLabel}`);
  const {width,height}=svgSize(c),m={top:18,right:20,bottom:45,left:55};const svg=d3.select(c).append('svg').attr('viewBox',`0 0 ${width} ${height}`);
  const x=d3.scaleLinear().domain([0,Math.max(1,d3.max(sampled,v=>v.lead_time)||1)]).nice().range([m.left,width-m.right]);const y=d3.scaleLinear().domain([0,Math.max(1,d3.max(sampled,v=>v.adr)||1)]).nice().range([height-m.bottom,m.top]);
  const plotW=width-m.left-m.right,plotH=height-m.top-m.bottom;
  const clipId='scatterClipD3Final';svg.append('defs').append('clipPath').attr('id',clipId).append('rect').attr('x',m.left).attr('y',m.top).attr('width',plotW).attr('height',plotH);
  // Grid is intentionally drawn before points so it can never sit on top of the markers.
  svg.append('g').attr('class','grid').attr('transform',`translate(${m.left},0)`).call(d3.axisLeft(y).ticks(6).tickSize(-plotW).tickFormat(''));
  const gx=svg.append('g').attr('class','axis').attr('transform',`translate(0,${height-m.bottom})`).call(d3.axisBottom(x));
  const gy=svg.append('g').attr('class','axis').attr('transform',`translate(${m.left},0)`).call(d3.axisLeft(y).ticks(6));
  svg.append('text').attr('class','axis-label').attr('x',(m.left+width-m.right)/2).attr('y',height-8).attr('text-anchor','middle').text('Lead Time (วัน)');
  svg.append('text').attr('class','axis-label').attr('transform',`translate(13,${(m.top+height-m.bottom)/2}) rotate(-90)`).attr('text-anchor','middle').text('ADR ($)');
  const plot=svg.append('g').attr('clip-path',`url(#${clipId})`).attr('class','scatter-plot-layer');
  const centerX=(m.left+width-m.right)/2,centerY=(m.top+height-m.bottom)/2;
  const pointGroups=[];
  defs.forEach(([label,test,color],gi)=>{
    const data=sampled.filter(test);
    const pts=plot.append('g').selectAll('circle').data(data).join('circle').attr('class',`point p${gi}`)
      .attr('cx',centerX).attr('cy',centerY).attr('r',0).attr('fill',color).attr('stroke','none').attr('opacity',0).style('cursor','pointer');
    pointGroups.push(pts);
    pts.on('mouseenter',function(e,v){
      pointGroups.forEach(g=>g.attr('opacity',.14));d3.select(this).attr('opacity',1).attr('r',7);
      showTip(label,[tipRow(color,'Lead Time',`${fmt(v.lead_time)} วัน`),tipRow(color,'ADR',`$${Number(v.adr).toFixed(2)}`)],e);
    }).on('mousemove',(e)=>moveTip(e)).on('mouseleave',function(){pointGroups.forEach(g=>g.attr('opacity',.82));d3.select(this).attr('r',3.2);hideTip()});
    // IMPORTANT: animate x/y attributes directly. No transform is used, so no artificial lines can appear.
    pts.transition().duration(1600).ease(d3.easeCubicInOut).delay((v,i)=>Math.min(i*3,1100))
      .attr('cx',v=>x(v.lead_time)).attr('cy',v=>y(v.adr)).attr('r',3.2).attr('opacity',.82);
  });
  const zoom=d3.zoom()
  .scaleExtent([1,8])
  .extent([[m.left,m.top],[width-m.right,height-m.bottom]])
  .translateExtent([[m.left,m.top],[width-m.right,height-m.bottom]])
    .on('zoom',e=>{const zx=e.transform.rescaleX(x),zy=e.transform.rescaleY(y);gx.call(d3.axisBottom(zx));gy.call(d3.axisLeft(zy).ticks(6));pointGroups.forEach(g=>g.attr('cx',v=>zx(v.lead_time)).attr('cy',v=>zy(v.adr)))});
  svg.call(zoom);
  $('scatterLegend').innerHTML=defs.map(v=>`<span class="legend-pill"><i class="legend-dot" style="background:${v[2]}"></i>${v[0]}</span>`).join('');
}

function renderModel(){
  const c=clearChart('modelChart');const {width,height}=svgSize(c),m={top:30,right:25,bottom:50,left:60};
  const labels=['Accuracy','Precision','Recall','F1-Score','ROC-AUC'],rf=[71.78,49.14,72.34,58.52,79.38],lr=[67.94,44.75,70.18,54.65,75.04];
  const svg=d3.select(c).append('svg').attr('viewBox',`0 0 ${width} ${height}`);const x0=d3.scaleBand().domain(labels).range([m.left,width-m.right]).padding(.25);const x1=d3.scaleBand().domain(['rf','lr']).range([0,x0.bandwidth()]).padding(.15);const y=d3.scaleLinear().domain([0,100]).range([height-m.bottom,m.top]);
  svg.append('g').attr('class','grid').attr('transform',`translate(${m.left},0)`).call(d3.axisLeft(y).ticks(10).tickSize(-(width-m.left-m.right)).tickFormat(''));
  svg.append('g').attr('class','axis').attr('transform',`translate(0,${height-m.bottom})`).call(d3.axisBottom(x0).tickSize(0));svg.append('g').attr('class','axis').attr('transform',`translate(${m.left},0)`).call(d3.axisLeft(y).ticks(10).tickFormat(v=>v+'%'));
  const rows=labels.map((metric,i)=>({metric,rf:rf[i],lr:lr[i]}));const groups=svg.append('g').selectAll('.metric').data(rows).join('g').attr('transform',v=>`translate(${x0(v.metric)},0)`);const seriesFixed=[['rf',COLORS.rf],['lr',COLORS.lr]];
  const allBars=groups.selectAll('rect').data(v=>seriesFixed.map(([key,color])=>({key,color,value:v[key],metric:v.metric}))).join('rect').attr('x',v=>x1(v.key)).attr('y',height-m.bottom).attr('width',x1.bandwidth()).attr('height',0).attr('rx',9).attr('fill',v=>v.color).attr('opacity',.88).style('cursor','pointer');
  allBars.on('mouseenter',function(e,v){allBars.attr('opacity',.2);d3.select(this).attr('opacity',1);showTip(v.key==='rf'?'Random Forest':'Logistic Regression',[tipRow(v.color,v.metric,`${v.value.toFixed(2)}%`)],e)}).on('mousemove',(e)=>moveTip(e)).on('mouseleave',function(){allBars.attr('opacity',.88);hideTip()});
  allBars.transition().duration(1900).ease(d3.easeCubicInOut).delay((v,i)=>i*180).attr('y',v=>y(v.value)).attr('height',v=>height-m.bottom-y(v.value));
  groups.selectAll('.value-label').data(v=>seriesFixed.map(([key,color])=>({key,color,value:v[key]}))).join('text').attr('class','value-label').attr('x',v=>x1(v.key)+x1.bandwidth()/2).attr('y',v=>y(v.value)-7).attr('text-anchor','middle').attr('fill',v=>v.color).attr('font-size','10px').text(v=>v.value.toFixed(1)+'%').attr('opacity',0).transition().duration(600).delay((v,i)=>i*180+1050).attr('opacity',1);
}

function renderAll(){updateKPIs();renderBar();renderLine();renderDonut();renderScatter()}
function switchPage(page){document.querySelectorAll('.page-content').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.nav-tab').forEach(x=>x.classList.remove('active'));$('page'+page.slice(-1)).classList.add('active');$('tab-'+page).classList.add('active');if(page==='page2')requestAnimationFrame(renderModel)}
function bind(){
  ['globalHotel','globalStatus','globalDeposit','globalRequests','globalSegment'].forEach(id=>$(id).addEventListener('change',renderAll));
  $('btnResetGlobal').onclick=()=>{['globalHotel','globalStatus','globalDeposit','globalRequests','globalSegment'].forEach(id=>$(id).value='All');renderAll()};
  $('barGroupSelect').onchange=renderBar;$('btnResetBar').onclick=()=>{$('barGroupSelect').value='hotel';renderBar()};
  $('lineMetricSelect').onchange=renderLine;$('btnResetLine').onclick=()=>{$('lineMetricSelect').value='bookings';renderLine()};
  $('donutViewSelect').onchange=renderDonut;$('btnResetDonut').onclick=()=>{$('donutViewSelect').value='status';renderDonut()};
  $('scatterColorSelect').onchange=renderScatter;$('btnResetScatter').onclick=renderScatter;
}
async function loadData(){
  try{
    rawData=(await d3.csv(DATA_PATH,parseRow)).filter(x=>x.hotel&&Number.isFinite(x.is_canceled)&&Number.isFinite(x.lead_time)&&Number.isFinite(x.adr));
    initFilters();bind();renderAll();
  }catch(err){console.error('CSV load failed:',err);const msg=document.createElement('div');msg.style.cssText='padding:20px;color:#b91c1c;font-size:12px';msg.textContent='โหลดข้อมูลไม่สำเร็จ: โปรดเปิดโฟลเดอร์ผ่าน Live Server';document.querySelector('main').prepend(msg)}
}
window.addEventListener('load',loadData);
window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{renderAll();if($('page2').classList.contains('active'))renderModel()},180)});
