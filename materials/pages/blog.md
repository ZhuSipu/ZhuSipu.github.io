---
layout: blog
title: Sipu Zhu Blog
blog_title: Sipu Zhu Blog
permalink: /blog/
description: Notes on architecture, spatial intelligence, AI, travel, and the built environment.
hero_image: /assets/img/user/photography/photo-08.jpg
nav: false
nav_order: 4
---

{% assign blog_posts = site.pages | where: 'blog_post', true | sort: 'date' | reverse %}
{% include blog_posts.liquid posts=blog_posts %}
