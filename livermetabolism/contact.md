---
layout: page
title: Contact
permalink: /contact/
---

<div class="container-fluid">
	<div class="row">
	  <div class="col-md-6">
		  <h3>Matthias König</h3>
			<p>
			<b>Junior Group Leader</b><br />
			<b>LiSym - Systems Medicine of the Liver</b><br />
			<img src="../images/vln-bw.png"><br /><br />
			Institute for Theoretical Biology<br>
			Humboldt-University Berlin<br>
			Invalidenstraße 43, 10117 Berlin, Germany<br>
			phone +49 30 2093-8450<br>
			<a href="mailto:{{ site.email }}">{{ site.email }}</a><br><br>
	 		{% if site.github_username %}
	            {% include icon-github.html username=site.github_username %}<br>
	          {% endif %}

	          {% if site.twitter_username %}
	            {% include icon-twitter.html username=site.twitter_username %}<br>
	          {% endif %}
			<a href="https://www.researchgate.net/profile/Matthias_Koenig4/" target="_blank">ResearchGate</a><br>
			<a href="http://scholar.google.com/citations?user=xD9IjnYAAAAJ&hl=en" target="_blank">Google Scholar</a><br>
			</p>
	  </div>
	  <div class="col-md-6">
	  	<h2>&nbsp;</h2>
	  	<p>
		<img src="../images/matthias_small.png">
	    </p>
	  </div>
	</div>

	<div class="row">
	<h3>Publications</h3>
	<table class="table table-hover">
		{% for publication in site.data.publications %}
		<tr>
			<td><b>{{ publication.year }}</b></td>
			<td>
				{% if publication.pdf %}
				<a href="../paper/{{ publication.pdf }}"><img src="../images/pdf.png" title="pdf"/></a>
				{% endif %}
				{% if publication.project %}
				<a href="{{ publication.project }}"><img src="../images/project.png" title="project homepage"/></a>
				{% endif %}
				{% if publication.repository %}
				<a href="{{ publication.repository }}"><img src="../images/repository.png" title="repository"/></a>
				{% endif %}
			</td>
			<td>{{ publication.authors }} <br />
				<i>{{ publication.title }}</i><br />
				{{ publication.journal }}
			</td>
			<td></td>
		</tr>
		{% endfor %}
	</table>
	</div>
</div>

<!--
<h3>Research Interests</h3>
<ul>
  <li>Multi-scale modeling of liver metabolism</li>
  <li>Kinetic modeling of biological systems</li>
	  <li>Liver central metabolism (focus on glucose & fatty acid metabolism)</li>
  <li>Software Development for metabolic network analysis, data management and visualization (SBML)</li>
  <li>Constraint-based methods (FBA) in metabolic networks</li>
</ul>
-->
