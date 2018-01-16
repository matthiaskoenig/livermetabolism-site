---
layout: page
title: Publications
permalink: /docs/publications/
---
<div class="container-fluid">
	<div class="row">
	<h1>Publications</h1>
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
