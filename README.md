# LogShare-Backend

[![Build Status](https://travis-ci.org/OhMinsSup/logshare-backend.svg?branch=master)](https://travis-ci.org/OhMinsSup/logshare-backend)

LogShares는 블로그형 sns 서비스 입니다. hashnode 서비스를 참고해서 제작
백엔드에서는 Koa, MongoDB, Typescript, Webpack, Prettier, rss 기술들을 사용하였습니다.

## Features implemented:

- 구글, 페이스북, 깃헙의 sdk를 이용한 소셜 회원가입
- 이벤트 프로모션등을 이메일 형태로 전달 NodeMailer.
- 좋아요, 팔로우, 팔로잉, 추천, 트렌딩 한 유저및 포스트를 보여줍니다
- cloudinary를 이용한 파일 업로드
- 내가 원하는 태그에 대한 리스트를 볼 수 있습니다.
- 내가 팔로우, 팔로잉 유저가 작성한 포스트및 좋아요를 할 경우 알림서비스
- rss 피트를 생성하는 코드

## Packages used:
    cloudinary
    dotev
    koa-static
    koa-body
    koa-router
    koa
    koa-session
    koa-helmet
    koa-cors
    koa-compress
    joi
    json-diff
    jsonwebtoken
    lodash
    mongoose
    googleapis
    github
    feed
    fb
    nodemailer
    remove-markdown
    qs
    shortid

### On the backend:

- Koa - RestAPI, typescript (Server ❤️)
- Mongoose - typescript (ORM 💪🏻)
- Cloudinary (File Uploads 🗂) 
- Nodemailer (Sending Emails 💌)
- Crypto (Passwords 🔒)
- JWT (Auth 🔑)
- MongoDB (DB 📃)
- Social SDK (FB, Google, Github 📱)