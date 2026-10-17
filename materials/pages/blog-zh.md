---
layout: page
title: blog
blog_home: true
blog_title: Unbuilts
permalink: /blog/zh/
description: history, reality, and other unfinished structures
lang: zh
translation_url: /blog/
translation_label: EN
translation_lang: en
nav: false
---

{% assign blog_posts = site.pages | where: 'blog_post', true | where: 'lang', 'zh' | sort: 'date' | reverse %}
{% include blog_posts.liquid posts=blog_posts %}
