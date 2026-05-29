---
layout: page
title: blog
blog_home: true
blog_title: Unbuilts
permalink: /blog/en/
description: history, reality, and other unfinished structures
lang: en
translation_url: /blog/
translation_label: 中文
translation_lang: zh
nav: false
---

{% assign blog_posts = site.pages | where: 'blog_post', true | where: 'lang', 'en' | sort: 'date' | reverse %}
{% include blog_posts.liquid posts=blog_posts %}
