---
layout: page
title: Contact
permalink: /contact/
---
<div class="table-responsive">
<!-- DO NOT USE TABLE -->

<table class="table">
  <tbody><tr>
   <td width="35">&nbsp;</td>
  	<td><img src="../images/matthias.png"></td>
	<td width="50">&nbsp;</td>
	<td width="550">
		<h2>Matthias König</h2>
		<p>
		<b>Junior Group Leader</b><br>
		<b>LiSym - Systems Medicine of the Liver</b><br>
		<img src="../images/vln-bw.png"><br><br>
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
	</td>
  </tr>
</tbody>
</table>
</div>

<h3>Publications</h3>
<table class="table">
	{% for publication in site.data.publications %}
	<tr>
		<td>{{ publication.year }}</td>
		<td>{{ publication.authors }} <br />
			<i>{{ publication.title }}</i><br />
			{{ publication.journal }}<br />
			{{ publication.project }}
		</td>
		<td></td>
	</tr>
	{% endfor %}
</table>

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
