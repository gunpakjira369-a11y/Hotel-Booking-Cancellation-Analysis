# Hotel-Booking-Cancellation-Analysis

## สมาชิก

1. น.ส. จุฑามาศ ปริยานนท์
2. น.ส. ภัคจิรา แอกทอง

### บทบาทหน้าที่ 

| สมาชิก | บทบาทหลัก |
|---|---|
| นางสาวภัคจิรา แอกทอง | Data Cleaning, Data Preparation, Documentation, GitHub |
| นางสาวจุฑามาศ ปริยานนท์ | Data Analysis, Web Visualization, Modeling, Evaluation |

## Dataset

- **ชื่อ Dataset:** Hotel booking demand
- **แหล่งข้อมูล:** Kaggle
- **ผู้เผยแพร่ Dataset:** Jesse Mostipak
- **ลิงก์ Dataset:** https://www.kaggle.com/datasets/jessemostipak/hotel-booking-demand

## คำถามวิจัยหลัก
> **“ปัจจัยในการจองมีความเกี่ยวข้องกับการยกเลิก Booking หรือไม่?”**
> 
### คำถามที่ใช้ในการวิเคราะห์
เพื่อช่วยตอบคำถามวิจัยหลัก การกำหนดคำถามที่ใช้ในการวิเคราะห์ดังนี้
1. Booking มีอัตราการยกเลิกมากน้อยเพียงใด
2. ประเภทโรงแรมมีความสัมพันธ์กับสถานะการยกเลิก Booking หรือไม่
3. กลุ่มตลาดมีความสัมพันธ์กับสถานะการยกเลิก Booking หรือไม่
4. ประเภทการวางเงินมัดจำมีความสัมพันธ์กับสถานะการยกเลิก Booking หรือไม่
5. ระยะเวลาการจองล่วงหน้า (Lead Time) มีความสัมพันธ์กับสถานะการยกเลิก Booking หรือไม่
6. ราคาเฉลี่ยห้องพัก (ADR) และจำนวนคำขอพิเศษมีรูปแบบอย่างไรเมื่อเปรียบเทียบระหว่าง Booking ที่ยกเลิกและไม่ยกเลิก
7. ปัจจัยที่เลือกสามารถนำไปใช้สร้างแบบจำลองเพื่อจำแนกสถานะการยกเลิก Booking ได้หรือไม่

### วัตถุประสงค์โครงการ
1. เพื่อสำรวจและทำความเข้าใจข้อมูลการจองโรงแรม รวมถึงตรวจสอบและแก้ไขปัญหาด้านคุณภาพของข้อมูลให้เหมาะสมสำหรับการวิเคราะห์
2. เพื่อวิเคราะห์และเปรียบเทียบลักษณะของ Booking ที่ยกเลิกและไม่ยกเลิก โดยพิจารณาจากปัจจัยในการจอง ได้แก่ hotel, market_segment, deposit_type, lead_time, adr และ total_of_special_requests
3. เพื่อศึกษารูปแบบและความแตกต่างของปัจจัยในการจองที่เกี่ยวข้องกับสถานะการยกเลิก Booking และสรุป Insight ที่ได้จากการวิเคราะห์
4. เพื่อสร้างและเปรียบเทียบแบบจำลอง Logistic Regression และ Random Forest สำหรับจำแนกสถานะการยกเลิก Booking และประเมินผลการทำงานของแบบจำลอง
5. เพื่อพัฒนา Interactive Data Visualization ด้วย D3.js และ Chart.js สำหรับนำเสนอและสำรวจข้อมูลการจองและสถานะการยกเลิกผ่านกราฟและตัวกรองข้อมูลแบบ Interactive

## กำหนดการประชุม

| ครั้ง | ช่วงเวลา | ประเด็นที่ประชุม |
|---|---|---|
| ครั้งที่ 1 | สัปดาห์ที่ 1 | ค้นหาและเลือก Dataset พร้อมแบ่งหน้าที่สมาชิก |
| ครั้งที่ 2 | สัปดาห์ที่ 1 | กำหนดคำถามหลัก คำถามที่ใช้ในการวิเคราะห์ และตรวจสอบข้อมูลเบื้องต้น |
| ครั้งที่ 3 | สัปดาห์ที่ 2 | ตรวจสอบและทำความสะอาดข้อมูล (Data Cleaning) พร้อมเตรียมข้อมูลสำหรับการวิเคราะห์ |
| ครั้งที่ 4 | สัปดาห์ที่ 2 | คัดเลือกตัวแปร กำหนด Target Variable เลือกและเปรียบเทียบ Model |
| ครั้งที่ 5 | สัปดาห์ที่ 3 | ประเมินผล Model ตรวจสอบ Visualization, Web, Deployment และเตรียมงานก่อนส่ง |

## วิธีรันโปรเจกต์

### การรันโปรเจกต์
1. Clone Repository
2. เปิดไฟล์ `index.html` ของแต่ละเวอร์ชันผ่าน Web Browser
3. หรือเปิดโปรเจกต์ผ่าน Local Server เพื่อให้สามารถโหลดไฟล์ข้อมูลได้อย่างถูกต้อง

### โครงสร้าง Web Visualization

- `web/d3/index.html` — เวอร์ชัน D3.js
- `web/chartjs/index.html` — เวอร์ชัน Chart.js

## เว็บไซต์ที่เผยแพร่

- **D3.js:** https://gunpakjira369-a11y.github.io/Hotel-Booking-Cancellation-Analysis/web/d3/index.html
- **Chart.js:** https://gunpakjira369-a11y.github.io/Hotel-Booking-Cancellation-Analysis/web/chartjs/index.html
- **GitHub Repository:** https://github.com/gunpakjira369-a11y/Hotel-Booking-Cancellation-Analysis

## ผลที่คาดว่าจะได้รับ

1. ได้ชุดข้อมูลการจองโรงแรมที่ผ่านการตรวจสอบและทำความสะอาดข้อมูล พร้อมสำหรับการวิเคราะห์
2. ได้ผลการวิเคราะห์ปัจจัยที่เกี่ยวข้องกับสถานะการยกเลิก Booking
3. ได้แบบจำลองสำหรับจำแนกสถานะการยกเลิก Booking และผลการเปรียบเทียบระหว่าง Logistic Regression และ Random Forest
4. ได้ผลการประเมินแบบจำลองด้วยตัวชี้วัดที่เหมาะสม และสามารถนำผลไปประกอบการสรุป Insight ได้
5. ได้ Interactive Data Visualization จำนวน 2 เวอร์ชัน ได้แก่ D3.js และ Chart.js สำหรับนำเสนอข้อมูลชุดเดียวกัน
6. ได้เว็บไซต์ที่สามารถใช้งานและเข้าถึงได้ผ่านช่องทางออนไลน์ พร้อม Source Code บน GitHub
7. ได้เอกสารแสดงกระบวนการทำงานและการแบ่งหน้าที่ของสมาชิกอย่างเป็นระบบ

# prompt

ฉันมีโปรเจกต์ Hotel Booking Dashboard ที่สร้างด้วย HTML, CSS และ JavaScript
โดยใช้ข้อมูลจากไฟล์ `data/hotel_bookings.csv`

ปัญหาหลักของโครงงานคือ

> **“ปัจจัยในการจองมีความเกี่ยวข้องกับการยกเลิก Booking หรือไม่”**

Dashboard พัฒนาด้วย **D3.js และ Chart.js** โดยใช้ข้อมูลจริงจาก
`data/hotel_bookings.csv`

---

## การสร้าง Dashboard 

Dashboard ต้องแสดงข้อมูลและการวิเคราะห์ดังต่อไปนี้

### 1. Key Performance Indicators (KPIs)

- **Total Bookings**
- **Total Cancellations**
- **Cancellation Rate**
- **Average ADR**

### 2. Cancellation Rate

แสดงกราฟ **Cancellation Rate** เพื่อวิเคราะห์อัตราการยกเลิก Booking

### 3. Lead Time กับ Cancellation

แสดงกราฟที่แสดงความสัมพันธ์ระหว่าง **Lead Time กับ Cancellation**

### 4. Market Segment

แสดงกราฟวิเคราะห์ข้อมูลตาม **Market Segment**

### 5. Deposit Type

แสดงกราฟวิเคราะห์ข้อมูลตาม **Deposit Type**

### 6. Hotel

แสดงกราฟวิเคราะห์ข้อมูลตาม **Hotel**

### 7. Model Evaluation

มีส่วนสำหรับแสดงผล **Model Evaluation**

### 8. Feature Importance

มีส่วนสำหรับแสดง **Feature Importance**

---

# การปรับแก้ Dashboard

ต้องการปรับ Dashboard เดิม โดย **ไม่สร้าง Dashboard ใหม่ทั้งหมด**

โดยให้เน้นการวิเคราะห์และแสดง **Cancellation Rate**
เพื่อให้ Dashboard สามารถตอบปัญหาหลักของโครงงานได้โดยตรง

## 1. KPI

ให้คง KPI เดิมไว้ ได้แก่

- **Total Bookings**
- **Total Cancellations**
- **Cancellation Rate**
- **Average ADR**

---

## 2. Main Charts

ปรับกราฟหลัก 4 กราฟให้เน้น **Cancellation Rate**
แทนการแสดงข้อมูล Overview ทั่วไป

### 2.1 Cancellation Rate by Lead Time

แบ่ง Lead Time เป็นช่วง

- 0–7
- 8–30
- 31–60
- 61–90
- 91–180
- 181–365
- 366+

แสดงอัตราการยกเลิก (%) ของแต่ละช่วง

คำนวณจาก

```text
Cancellation Rate =
จำนวน Booking ที่ยกเลิก / จำนวน Booking ทั้งหมดในกลุ่ม × 100



