---
layout: page
title: blog
blog_home: true
blog_title: Unbuilts
permalink: /blog/
description: history, reality, and other unfinished structures
lang: zh
translation_url: /blog/en/
translation_label: EN
translation_lang: en
nav: true
nav_order: 4
---

{% assign blog_posts = site.pages | where: 'blog_post', true | where_exp: 'post', 'post.canonical_lang != false' | sort: 'date' | reverse %}
{% include blog_posts.liquid posts=blog_posts %}
