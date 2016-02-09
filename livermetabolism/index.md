---
layout: default
---

<div class="home">
 <div class="container">
      <div class="starter-template">
        <h1>Multiscale-galactose metabolism</h1>
        <p>Multiscale model of human galactose metabolism - from single hepatocytes to individual liver function. </p>
        {% for publication in site.data.publications %}
        {% if publication.id == "Koenig2016" %}
          <p>
          {% if publication.pdf %}
            <a href="../paper/{{ publication.pdf }}"><img src="../images/pdf.png" title="pdf"/></a>
          {% endif %}
          {% if publication.project %}
            <a href="{{ publication.project }}"><img src="../images/project.png" title="project homepage"/></a>
          {% endif %}
          {% if publication.repository %}
            <a href="{{ publication.repository }}"><img src="../images/repository.png" title="repository"/></a>
          {% endif %}
          </p>
          <p>
            {{ publication.authors }}<br />
            <i>{{ publication.title }}</i><br />
            {{ publication.journal }}
          </p>
        {% endif %}
        {% endfor %}
        <h3>Model overview</h3>
        <p>
          <img alt="Multiscale Galactose Model" title="Multiscale Galactose Model" src="./images/multiscale-galactose.png" />
        </p>
        
        <h3>GEC App</h3>
        <p>Calculation of individual liver function based on Galactose Elimination Capacity (GEC).</p>
        <p>
          <a href="./gec_app/" target="_blank"><img alt="GEC calculation App" src="./images/gec_app.png" /></a>
          <b><a href="./gec_app/" target="_blank">GEC App</a></b>
        </p>
        
        <h1>Pathobiochemical signatures of cholestatic liver disease</h1>
        
        {% for publication in site.data.publications %}
        {% if publication.id == "Abshagen2015" %}
          <p>
          {% if publication.pdf %}
            <a href="../paper/{{ publication.pdf }}"><img src="../images/pdf.png" title="pdf"/></a>
          {% endif %}
          {% if publication.project %}
            <a href="{{ publication.project }}"><img src="../images/project.png" title="project homepage"/></a>
          {% endif %}
          {% if publication.repository %}
            <a href="{{ publication.repository }}"><img src="../images/repository.png" title="repository"/></a>
          {% endif %}
          </p>
          <p>
            {{ publication.authors }}<br />
            <i>{{ publication.title }}</i><br />
            {{ publication.journal }}
          </p>
        {% endif %}
        {% endfor %}

      <p>
          <img alt="BDL correlation heatmap" title="BDL correlation heatmap" src="./images/BDL_correlation_heatmap.png" />
      </p>
        
      </div>

    </div><!-- /.container -->


  <!--
  <h1 class="page-heading">Posts</h1>

  <ul class="post-list">
    {% for post in site.posts %}
      <li>
        <span class="post-meta">{{ post.date | date: "%b %-d, %Y" }}</span>

        <h2>
          <a class="post-link" href="{{ post.url | prepend: site.baseurl }}">{{ post.title }}</a>
        </h2>
      </li>
    {% endfor %}
  </ul>

  <p class="rss-subscribe">subscribe <a href="{{ "/feed.xml" | prepend: site.baseurl }}">via RSS</a></p>
  -->
</div>
