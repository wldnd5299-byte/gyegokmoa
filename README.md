# 계곡모아

대한민국의 다양한 계곡을 지역별로 소개하고 위치, 전화번호, 주차·화장실 등 방문 정보를 제공하는 웹사이트입니다.

## 기술 구성

- Next.js App Router
- React + TypeScript
- CSS 반응형 디자인
- Lucide React 아이콘

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## GitHub에 올리기

```bash
git init
git add .
git commit -m "계곡모아 초기 프로젝트"
git branch -M main
git remote add origin https://github.com/사용자명/gyegokmoa.git
git push -u origin main
```

## 데이터 수정

계곡 정보는 `data/valleys.ts`에서 추가하거나 수정할 수 있습니다.

> 현재 등록된 주소와 연락처는 초기 화면 제작을 위한 샘플 데이터입니다. 실제 서비스 공개 전 각 지자체·관광기관의 최신 정보를 확인하세요.
