---
layout: page
title: blog
blog_home: true
blog_title: Unbuilts
permalink: /blog/
description: history, reality, and other unfinished structures
lang: en
translation_url: /blog/zh/
translation_label: 中文
translation_lang: zh
nav: true
nav_order: 4
---

{% assign blog_posts = site.pages | where: 'blog_post', true | where: 'lang', 'en' | sort: 'date' | reverse %}
{% include blog_posts.liquid posts=blog_posts %}
