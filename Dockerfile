# نسخه Node سبک
FROM node:20-alpine

# مسیر کاری داخل کانتینر
WORKDIR /usr/src/app

# فقط package.json و package-lock.json رو اول کپی می‌کنیم
COPY package*.json ./

# نصب فقط dependency ها
RUN npm install --production

# حالا کل پروژه رو کپی می‌کنیم
COPY . .

# پورت اپلیکیشن (از .env هم خونده میشه)
EXPOSE 3000

# دستور اجرا
CMD ["npm", "start"]
