Chart.defaults.font.family = "'Mali', cursive, sans-serif";
Chart.defaults.color = '#60788A';

const CSV_PATHS = [
  '../../data/raw/hotel_bookings.csv',
'../../data/raw/hotel_bookings.csv'
 
];

const COLORS = {
  city: '#8EC5FC',
  resort: '#B8A4E8',
  primary: '#8EC5FC',

  notCanceled: '#8DD3C7',
  canceled: '#FF9AA2',

  noDeposit: '#8EC5FC',
  refundable: '#FFD166',
  nonRefund: '#F4A6C8',

  direct: '#8EC5FC',
  corporate: '#B8A4E8',
  onlineTA: '#A8D8EA',
  offlineTA: '#C7CEEA',
  complementary: '#B5EAD7',
  groups: '#FFD6A5',
  aviation: '#FFDAC1',

  rf: '#8EC5FC',
  lr: '#B8A4E8',

  text: '#64859a',
  grid: '#eef6fa'
};

const palette = [
  '#8EC5FC',
  '#B8A4E8',
  '#A8D8EA',
  '#B5EAD7',
  '#FFD6A5',
  '#FFDAC1',
  '#F4A6C8',
  '#C7CEEA'
];

const $ = id => document.getElementById(id);

const fmt = n => Number(n || 0).toLocaleString('en-US');

const CATEGORY_COLORS = {
  'City Hotel': COLORS.city,
  'Resort Hotel': COLORS.resort,
  'ไม่ยกเลิก': COLORS.notCanceled,
  'ยกเลิก': COLORS.canceled,
  'No Deposit': COLORS.noDeposit,
  'Refundable': COLORS.refundable,
  'Non Refund': COLORS.nonRefund,
  'Non Refundable': COLORS.nonRefund
};

const LEAD_BUCKETS = [
  { label: '0–7 วัน', min: 0, max: 7 },
  { label: '8–30 วัน', min: 8, max: 30 },
  { label: '31–60 วัน', min: 31, max: 60 },
  { label: '61–90 วัน', min: 61, max: 90 },
  { label: '91–180 วัน', min: 91, max: 180 },
  { label: '181–365 วัน', min: 181, max: 365 },
  { label: '366+ วัน', min: 366, max: Infinity }
];

const MODEL_RESULTS = [
  {
    name: 'Random Forest',
    accuracy: 0.7178,
    precision: 0.4914,
    recall: 0.7234,
    f1: 0.5852,
    auc: 0.7938
  },
  {
    name: 'Logistic Regression',
    accuracy: 0.6794,
    precision: 0.4475,
    recall: 0.7018,
    f1: 0.5465,
    auc: 0.7504
  }
];

const MOTION = {
  duration: 1800,
  easing: 'easeInOutCubic'
};

let rawData = [];

let charts = {
  bar: null,
  line: null,
  donut: null,
  scatter: null,
  model: null
};
function parseRow(r){return{hotel:String(r.hotel??'').trim(),is_canceled:Number(r.is_canceled),lead_time:Number(r.lead_time),market_segment:String(r.market_segment??'').trim()||'Undefined',deposit_type:String(r.deposit_type??'').trim()||'Unknown',adr:Number(r.adr),total_of_special_requests:Number(r.total_of_special_requests)}}
function getFilteredData(){const h=$('globalHotel').value,s=$('globalStatus').value,d=$('globalDeposit').value,r=$('globalRequests').value,m=$('globalSegment').value;return rawData.filter(x=>(h==='All'||x.hotel===h)&&(s==='All'||x.is_canceled===Number(s))&&(d==='All'||x.deposit_type===d)&&(r==='All'||String(x.total_of_special_requests)===r)&&(m==='All'||x.market_segment===m))}
function fillSelect(id,values){const el=$(id),old=el.value;el.innerHTML='<option value="All">ทั้งหมด</option>';values.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;el.appendChild(o)});if(values.includes(old))el.value=old}
function initFilters(){fillSelect('globalHotel',[...new Set(rawData.map(x=>x.hotel))].filter(Boolean).sort());fillSelect('globalDeposit',[...new Set(rawData.map(x=>x.deposit_type))].filter(Boolean).sort());fillSelect('globalRequests',[...new Set(rawData.map(x=>x.total_of_special_requests))].filter(Number.isFinite).sort((a,b)=>a-b).map(String));fillSelect('globalSegment',[...new Set(rawData.map(x=>x.market_segment))].filter(Boolean).sort())}
function colorFor(label,index=0,kind='fallback'){if(CATEGORY_COLORS[label])return CATEGORY_COLORS[label];if(kind==='market')return COLORS.market[index%COLORS.market.length];if(kind==='request')return COLORS.request[index%COLORS.request.length];return '#A9D9EA'}
function filterSummary(){const parts=[];const map=[['globalHotel','โรงแรม'],['globalStatus','สถานะ'],['globalDeposit','มัดจำ'],['globalRequests','คำขอพิเศษ'],['globalSegment','กลุ่มตลาด']];map.forEach(([id,label])=>{const v=$(id)?.value;if(v&&v!=='All')parts.push(`${label}: ${v==='0'?'ไม่ยกเลิก':v==='1'?'ยกเลิก':v}`)});return parts.length?` • กรอง ${parts.join(' · ')}`:' • ข้อมูลทั้งหมด'}
function setTitle(id,title,desc){$(id).textContent=title;const d=$(id.replace('Title','Desc'));if(d)d.textContent=desc+filterSummary()}
function updateKPIs(){const d=getFilteredData(),total=d.length,c=d.filter(x=>x.is_canceled===1).length,adr=total?d.reduce((s,x)=>s+x.adr,0)/total:0; $('kpiTotal').textContent=total.toLocaleString();$('kpiCanceled').textContent=c.toLocaleString();$('kpiRate').textContent=`${total?(c/total*100).toFixed(1):'0.0'}%`;$('kpiAdr').textContent=`$${adr.toFixed(2)}`}
function destroy(name){if(charts[name]){charts[name].destroy();charts[name]=null}}
function redraw(id){const p=$(id)?.closest('.chart-panel');if(!p)return;p.classList.remove('redraw');void p.offsetWidth;p.classList.add('redraw')}
function commonPlugins(){return{legend:{display:false},tooltip:{backgroundColor:'#fff',titleColor:'#426B82',bodyColor:'#60788A',borderColor:'#D8ECF3',borderWidth:1,padding:10,displayColors:true}}}

function drawBarChart(){
  const c=$('barChartCanvas'),d=getFilteredData(),group=$('barGroupSelect').value;
  let key,label;
  if(group==='hotel'){key='hotel';label='ประเภทโรงแรม'}
  else if(group==='market_segment'){key='market_segment';label='กลุ่มตลาด'}
  else if(group==='deposit_type'){key='deposit_type';label='ประเภทมัดจำ'}
  else {key='total_of_special_requests';label='จำนวนคำขอพิเศษ (ครั้ง)'}

  const map={};
  d.forEach(x=>{
    const k=String(x[key]);
    if(!map[k])map[k]={notCanceled:0,canceled:0};
    if(x.is_canceled===1)map[k].canceled++;else map[k].notCanceled++;
  });
  const entries=Object.entries(map).sort((a,b)=>(b[1].canceled+b[1].notCanceled)-(a[1].canceled+a[1].notCanceled));
  setTitle('barTitle',`Booking ที่ยกเลิกและไม่ยกเลิก แยกตาม${label}`,`เปรียบเทียบ Cancelled กับ Not Cancelled ในแต่ละ${label}`);

  destroy('bar');
  charts.bar=new Chart(c,{
    type:'bar',
    data:{
      labels:entries.map(x=>x[0]),
      datasets:[
        {label:'ไม่ยกเลิก',data:entries.map(x=>x[1].notCanceled),backgroundColor:COLORS.notCanceled,borderColor:COLORS.notCanceled,borderRadius:9,borderSkipped:false,barPercentage:.46,categoryPercentage:.72},
        {label:'ยกเลิก',data:entries.map(x=>x[1].canceled),backgroundColor:COLORS.canceled,borderColor:COLORS.canceled,borderRadius:9,borderSkipped:false,barPercentage:.46,categoryPercentage:.72}
      ]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      animation:{duration:1800,easing:'easeInOutCubic',delay:ctx=>ctx.type==='data'?ctx.dataIndex*130:0},
      animations:{y:{from:ctx=>ctx.chart.scales?.y?.getPixelForValue(0),duration:1500,easing:'easeOutCubic'}},
      plugins:{
        ...commonPlugins(),
        tooltip:{...commonPlugins().tooltip,callbacks:{
          label:x=>`${x.dataset.label}: ${Number(x.raw).toLocaleString()} Booking`,
          afterBody:items=>{
            const i=items[0]?.dataIndex??0,row=entries[i]?.[1];
            if(!row)return '';
            const total=row.notCanceled+row.canceled;
            return `Cancellation Rate: ${(total?row.canceled/total*100:0).toFixed(1)}%`;
          }
        }}
      },
      scales:{
        x:{grid:{display:false},ticks:{color:COLORS.text,font:{size:9}}},
        y:{beginAtZero:true,grid:{color:COLORS.grid},ticks:{color:COLORS.text},title:{display:true,text:'จำนวน Booking',color:'#64859A',font:{size:10}}}
      }
    },
    plugins:[valueLabelPlugin]
  });
  $('barLegend').innerHTML=`<span class="legend-pill"><i class="legend-dot" style="background:${COLORS.notCanceled}"></i>ไม่ยกเลิก</span><span class="legend-pill"><i class="legend-dot" style="background:${COLORS.canceled}"></i>ยกเลิก</span>`;
  redraw('barChartCanvas');
}


function bucketRows(d,b){return d.filter(x=>x.lead_time>=b.min&&x.lead_time<=b.max)}
function bucketRows(d,b){return d.filter(x=>x.lead_time>=b.min&&x.lead_time<=b.max)}
function drawLineChart(){
  const c=$('lineChartCanvas'),d=getFilteredData(),metric=$('lineMetricSelect').value;
  const rows=LEAD_BUCKETS.map(b=>{
    const a=bucketRows(d,b),nc=a.filter(x=>x.is_canceled===0),ca=a.filter(x=>x.is_canceled===1);
    return {
      label:b.label,
      notCanceledBookings:nc.length,canceledBookings:ca.length,
      notCanceledAdr:nc.length?nc.reduce((s,x)=>s+x.adr,0)/nc.length:0,
      canceledAdr:ca.length?ca.reduce((s,x)=>s+x.adr,0)/ca.length:0,
      cancelRate:a.length?ca.length/a.length*100:0
    };
  });

  const isAdr=metric==='adr',isRate=metric==='cancelRate';
  const title=isAdr?'ADR ตามช่วง Lead Time':isRate?'อัตราการยกเลิกตามช่วง Lead Time':'Cancelled vs Not Cancelled ตามช่วง Lead Time';
  const desc=isAdr?'เปรียบเทียบราคาเฉลี่ยต่อคืนของ Booking ที่ยกเลิกและไม่ยกเลิกในแต่ละช่วง Lead Time':
    isRate?'แสดงสัดส่วน Booking ที่ยกเลิกในแต่ละช่วง Lead Time':
    'เปรียบเทียบจำนวน Booking ที่ยกเลิกและไม่ยกเลิกในแต่ละช่วง Lead Time';
  setTitle('lineTitle',title,desc);
  destroy('line');

  const datasets=isRate
    ?[{label:'อัตราการยกเลิก',data:rows.map(x=>x.cancelRate),borderColor:COLORS.canceled,backgroundColor:'rgba(255,142,142,.16)',fill:true}]
    :isAdr
      ?[{label:'ไม่ยกเลิก',data:rows.map(x=>x.notCanceledAdr),borderColor:COLORS.notCanceled,backgroundColor:'rgba(114,214,162,.13)',fill:true},
        {label:'ยกเลิก',data:rows.map(x=>x.canceledAdr),borderColor:COLORS.canceled,backgroundColor:'rgba(255,142,142,.13)',fill:true}]
      :[{label:'ไม่ยกเลิก',data:rows.map(x=>x.notCanceledBookings),borderColor:COLORS.notCanceled,backgroundColor:'rgba(114,214,162,.13)',fill:true},
        {label:'ยกเลิก',data:rows.map(x=>x.canceledBookings),borderColor:COLORS.canceled,backgroundColor:'rgba(255,142,142,.13)',fill:true}];

  datasets.forEach(ds=>Object.assign(ds,{tension:.42,borderWidth:3,pointRadius:4,pointHoverRadius:7,pointBackgroundColor:'#fff',pointBorderWidth:2.5,fill:true}));
  charts.line=new Chart(c,{
    type:'line',
    data:{labels:rows.map(x=>x.label),datasets},
    options:{
      responsive:true,maintainAspectRatio:false,
      animation:{duration:1900,easing:'easeInOutCubic',delay:ctx=>ctx.type==='data'?ctx.dataIndex*150:0},
      animations:{y:{from:ctx=>ctx.chart.scales?.y?.getPixelForValue(0),duration:1400,easing:'easeOutCubic'}},
      plugins:{
        ...commonPlugins(),
        tooltip:{...commonPlugins().tooltip,callbacks:{
          label:x=>{
            const row=rows[x.dataIndex],key=x.dataset.label==='ยกเลิก'?(isAdr?'canceledAdr':'canceledBookings'):x.dataset.label==='ไม่ยกเลิก'?(isAdr?'notCanceledAdr':'notCanceledBookings'):'cancelRate';
            if(isRate)return `${x.dataset.label}: ${Number(x.raw).toFixed(2)}%`;
            return `${x.dataset.label}: ${isAdr?'$'+Number(x.raw).toFixed(2):Number(x.raw).toLocaleString()+' Booking'}`;
          },
          afterBody:items=>{
            if(!isRate){
              const row=rows[items[0]?.dataIndex??0];
              return `Cancellation Rate: ${(row.cancelRate||0).toFixed(1)}%`;
            }
            return '';
          }
        }}
      },
      scales:{
        x:{grid:{display:false},ticks:{color:COLORS.text}},
        y:{beginAtZero:true,grid:{color:COLORS.grid},ticks:{color:COLORS.text,callback:v=>isAdr?'$'+v:isRate?v+'%':v},title:{display:true,text:isAdr?'ADR ($)':isRate?'Cancellation Rate (%)':'จำนวน Booking',color:'#64859A',font:{size:10}}}
      }
    }
  });
  $('lineLegend').innerHTML=datasets.map(ds=>`<span class="legend-pill"><i class="legend-dot" style="background:${ds.borderColor}"></i>${ds.label}</span>`).join('');
  redraw('lineChartCanvas');
}


const donutCenter={id:'donutCenter',afterDraw(chart){const a=chart.chartArea;if(!a)return;const ctx=chart.ctx,total=chart.data.datasets[0].data.reduce((s,v)=>s+v,0);ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#426B82';ctx.font='700 22px Mali';ctx.fillText(total.toLocaleString(),(a.left+a.right)/2,(a.top+a.bottom)/2-8);ctx.fillStyle='#8AA1AF';ctx.font='500 10px Mali';ctx.fillText('Booking ทั้งหมด',(a.left+a.right)/2,(a.top+a.bottom)/2+15);ctx.restore()}};
function drawDonutChart(){const c=$('donutChartCanvas'),d=getFilteredData(),view=$('donutViewSelect').value;let labels=[],values=[];if(view==='status'){labels=['ไม่ยกเลิก','ยกเลิก'];values=[d.filter(x=>x.is_canceled===0).length,d.filter(x=>x.is_canceled===1).length]}else if(view==='hotel'){labels=['City Hotel','Resort Hotel'];values=[d.filter(x=>x.hotel==='City Hotel').length,d.filter(x=>x.hotel==='Resort Hotel').length]}else{const m={};d.forEach(x=>m[x.deposit_type]=(m[x.deposit_type]||0)+1);labels=Object.keys(m);values=Object.values(m)}const colors=labels.map((x,i)=>colorFor(x,i));const viewLabel=view==='status'?'สถานะการจอง':view==='hotel'?'ประเภทโรงแรม':'ประเภทมัดจำ';setTitle('donutTitle',`สัดส่วน${viewLabel}`,`วงแหวนแสดงสัดส่วน${viewLabel} ของ Booking`);destroy('donut');charts.donut=new Chart(c,{type:'doughnut',data:{labels,datasets:[{data:values,backgroundColor:colors,borderColor:'#fff',borderWidth:5,hoverOffset:9}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',animation:{duration:1900,easing:'easeOutCubic',animateRotate:true,animateScale:true},plugins:{...commonPlugins(),tooltip:{...commonPlugins().tooltip,callbacks:{label:x=>`${x.label}: ${x.raw.toLocaleString()} Booking (${(x.raw/d.length*100||0).toFixed(1)}%)`}}}},plugins:[donutCenter]});$('donutLegend').innerHTML=labels.map((x,i)=>`<span class="legend-pill"><i class="legend-dot" style="background:${colors[i]}"></i>${x} · ${values[i].toLocaleString()}</span>`).join('');redraw('donutChartCanvas')}

function drawScatterChart(){const c=$('scatterChartCanvas'),d=getFilteredData().filter(x=>Number.isFinite(x.lead_time)&&Number.isFinite(x.adr)),by=$('scatterColorSelect').value;const defs=by==='hotel'?[['City Hotel',x=>x.hotel==='City Hotel',COLORS.city],['Resort Hotel',x=>x.hotel==='Resort Hotel',COLORS.resort]]:by==='status'?[['ไม่ยกเลิก',x=>x.is_canceled===0,COLORS.notCanceled],['ยกเลิก',x=>x.is_canceled===1,COLORS.canceled]]:[['No Deposit',x=>x.deposit_type==='No Deposit',COLORS.noDeposit],['Refundable',x=>x.deposit_type==='Refundable',COLORS.refundable],['Non Refund',x=>x.deposit_type==='Non Refund'||x.deposit_type==='Non Refundable',COLORS.nonRefund]];const sampled=d.length>2200?d.filter((_,i)=>i%Math.ceil(d.length/2200)===0):d;const byLabel=by==='hotel'?'ประเภทโรงแรม':by==='status'?'สถานะการจอง':'ประเภทมัดจำ';setTitle('scatterTitle',`ความสัมพันธ์ระหว่าง Lead Time กับ ADR — สีตาม${byLabel}`,`แต่ละจุดแทน Booking และใช้สีแยกตาม${byLabel}`);destroy('scatter');charts.scatter=new Chart(c,{type:'scatter',data:{datasets:defs.map(([label,test,color])=>({label,data:sampled.filter(test).map(x=>({x:x.lead_time,y:x.adr})),backgroundColor:color,borderColor:color,pointRadius:3.2,pointHoverRadius:7,pointBorderWidth:0}))},options:{responsive:true,maintainAspectRatio:false,animation:{duration:1850,easing:'easeInOutCubic',delay:ctx=>ctx.type==='data'?Math.min(ctx.dataIndex*3,1100):0},animations:{x:{from:ctx=>{const s=ctx.chart.scales?.x;return s?s.getPixelForValue((s.min+s.max)/2):ctx.x},duration:1600,easing:'easeInOutCubic'},y:{from:ctx=>{const s=ctx.chart.scales?.y;return s?s.getPixelForValue((s.min+s.max)/2):ctx.y},duration:1600,easing:'easeInOutCubic'}},plugins:{...commonPlugins(),tooltip:{...commonPlugins().tooltip,callbacks:{label:x=>`${x.dataset.label}: Lead Time ${Number(x.parsed.x).toLocaleString()} วัน · ADR $${Number(x.parsed.y).toFixed(2)}`}},zoom:{limits:{x:{min:0,max:'original'},y:{min:0,max:'original'}},pan:{enabled:true,mode:'xy'},zoom:{wheel:{enabled:true},pinch:{enabled:true},drag:{enabled:false},mode:'xy'}}},scales:{x:{min:0,grid:{display:false},ticks:{color:COLORS.text},title:{display:true,text:'Lead Time (วัน)',color:'#64859A',font:{size:10}}},y:{min:0,grid:{color:COLORS.grid},ticks:{color:COLORS.text},title:{display:true,text:'ADR ($)',color:'#64859A',font:{size:10}}}}}});$('scatterLegend').innerHTML=defs.map(x=>`<span class="legend-pill"><i class="legend-dot" style="background:${x[2]}"></i>${x[0]}</span>`).join('');redraw('scatterChartCanvas')}

const valueLabelPlugin={id:'valueLabelPlugin',afterDatasetsDraw(chart){if(chart.canvas.id!=='barChartCanvas'&&chart.canvas.id!=='modelCompareChartCanvas')return;const ctx=chart.ctx;ctx.save();ctx.textAlign='center';ctx.textBaseline='bottom';ctx.font='600 9px Mali';chart.data.datasets.forEach((ds,di)=>chart.getDatasetMeta(di).data.forEach((bar,i)=>{const full=Number(ds.data[i]);if(!Number.isFinite(full))return;const base=chart.scales.y.getPixelForValue(0),target=chart.scales.y.getPixelForValue(full),current=Math.max(0,Math.min(1,(base-bar.y)/(base-target||1)));ctx.fillStyle=di===0&&chart.canvas.id==='modelCompareChartCanvas'?COLORS.rf:chart.canvas.id==='modelCompareChartCanvas'?COLORS.lr:'#4D7186';ctx.fillText(chart.canvas.id==='modelCompareChartCanvas'?(full*1).toFixed(1)+'%':Math.round(full*current).toLocaleString(),bar.x,bar.y-7)}));ctx.restore()}};
function drawModelChart(){const c=$('modelCompareChartCanvas');destroy('model');const labels=['Accuracy','Precision','Recall','F1-Score','ROC-AUC'],rf=[71.78,49.14,72.34,58.52,79.38],lr=[67.94,44.75,70.18,54.65,75.04];charts.model=new Chart(c,{type:'bar',data:{labels,datasets:[{label:'Random Forest',data:rf,backgroundColor:COLORS.rf,borderRadius:9,borderSkipped:false,barPercentage:.52,categoryPercentage:.64},{label:'Logistic Regression',data:lr,backgroundColor:COLORS.lr,borderRadius:9,borderSkipped:false,barPercentage:.52,categoryPercentage:.64}]},options:{responsive:true,maintainAspectRatio:false,animation:{duration:1900,easing:'easeInOutCubic',delay:ctx=>ctx.type==='data'?ctx.dataIndex*180:0},animations:{y:{from:ctx=>ctx.chart.scales?.y?.getPixelForValue(0),duration:1650,easing:'easeOutCubic'}},plugins:{legend:{display:false},tooltip:{backgroundColor:'#fff',titleColor:'#426B82',bodyColor:'#60788A',borderColor:'#D8ECF3',borderWidth:1,padding:10,callbacks:{label:x=>`${x.dataset.label}: ${Number(x.raw).toFixed(2)}%`}}},scales:{x:{grid:{display:false},ticks:{color:COLORS.text}},y:{min:0,max:100,grid:{color:COLORS.grid},ticks:{color:COLORS.text,callback:v=>v+'%'},title:{display:true,text:'ค่าประสิทธิภาพ (%)',color:'#64859A',font:{size:10}}}}},plugins:[valueLabelPlugin]})}

function renderAll(){updateKPIs();drawBarChart();drawLineChart();drawDonutChart();drawScatterChart()}
function switchPage(page){document.querySelectorAll('.page-content').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.nav-tab').forEach(x=>x.classList.remove('active'));$('page'+page.slice(-1)).classList.add('active');$('tab-'+page).classList.add('active');if(page==='page2')requestAnimationFrame(drawModelChart)}
function bind(){['globalHotel','globalStatus','globalDeposit','globalRequests','globalSegment'].forEach(id=>$(id).addEventListener('change',renderAll));$('btnResetGlobal').onclick=()=>{['globalHotel','globalStatus','globalDeposit','globalRequests','globalSegment'].forEach(id=>$(id).value='All');renderAll()};$('barGroupSelect').onchange=drawBarChart;$('btnResetBar').onclick=()=>{$('barGroupSelect').value='hotel';drawBarChart()};$('lineMetricSelect').onchange=drawLineChart;$('btnResetLine').onclick=()=>{$('lineMetricSelect').value='bookings';drawLineChart()};$('donutViewSelect').onchange=drawDonutChart;$('btnResetDonut').onclick=()=>{$('donutViewSelect').value='status';drawDonutChart()};$('scatterColorSelect').onchange=drawScatterChart;$('btnResetScatter').onclick=()=>{$('scatterColorSelect').value='status';charts.scatter?.resetZoom();drawScatterChart()}
}
function loadCSV(){const next=i=>{if(i>=CSV_PATHS.length){console.error('CSV load failed');return}Papa.parse(CSV_PATHS[i],{download:true,header:true,skipEmptyLines:true,complete:r=>{const rows=r.data.map(parseRow).filter(x=>x.hotel&&Number.isFinite(x.is_canceled)&&Number.isFinite(x.lead_time)&&Number.isFinite(x.adr));if(rows.length){rawData=rows;initFilters();bind();renderAll()}else next(i+1)},error:()=>next(i+1)})};next(0)}
window.addEventListener('load',loadCSV);window.addEventListener('resize',()=>{if($('page2').classList.contains('active'))drawModelChart()});
