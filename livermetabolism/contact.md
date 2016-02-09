---
layout: page
title: Contact
permalink: /contact/
---

<table cellpadding="0">
  <tbody><tr>
   <td width="35">&nbsp;</td>
  	<td><img src="./images/matthias.png"></td>
	<td width="35">&nbsp;</td>
	<td width="550">
		<h2>Matthias K&ouml;nig</h2>
		<p>
		<b>Junior Group Leader</b><br>
		<b>LiSym - Systems Medicine of the Liver</b><br>
		<img src="images/vln-bw.png"><br><br>
		Institute for Theoretical Biology<br>
		Humboldt-University Berlin<br>
		Invalidenstra&szlig;e 43, 10117 Berlin, Germany<br>
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

<ul>
{% for member in site.data.members %}
  <li>
    <a href="https://github.com/{{ member.github }}">
      {{ member.name }}
    </a>
  </li>
{% endfor %}
</ul>


<table class="table">
	{% for p in site.data.publications %}
	<tr>
		<td>{{ p.year }}</td>
		<td>{{ p.authors }} <br />
			<i>{{ p.title }}</i><br />
			{{ p.journal }}<br />
			{{ p.project }}
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


<!-- use the json content to encode the publications -->
<h3>Publications</h3>

<table class="table">
<tr><td>2016</td><td>Choi K., Medley JK., Cannistra C., <b>K&ouml;nig M.</b>, Smith L., Stocking K., and Sauro HM.<br>
<i>Tellurium: A Python Based Integrated Environment for Biological Modeling and Simulation</i><br>
[in preparation]<br>
<a href="http://tellurium.readthedocs.org/en/latest/">Tellurium project</a>
</td><td></td></tr>

<tr><td>2016</td><td><b>K&ouml;nig M.</b>, Marchesini G., Vilstrup H., and Holzh&uuml;tter HG.<br>
<i>A Multiscale Computational Model Predicts Human Liver Function From Single-Cell Metabolism</i><br>
[in preparation]</td><td></td></tr>

<tr><td>2015</td><td>Kerstin A.<b>*</b>, <b>K&ouml;nig M.*</b>, Hoppe A., Thomas M., M&uuml;ller I., Ebert M., Weng H., Holzh&uuml;tter HG., Zanger UM., Bode J., Vollmar B. and Dooley S.<br>
<b>* equal contribution</b><br>
<i>Pathobiochemical signatures of cholestatic liver disease in bile duct ligated mice</i><br>
BMC Syst Biol. 2015 Nov 20;9(1):83. doi: 10.1186/s12918-015-0229-0 
[<a href="http://www.ncbi.nlm.nih.gov/pubmed/26589287" target="_blank">PubMed</a>]</td><td></td></tr>

<tr><td>2015</td><td>Werner D., Ricken T., Dahmen U., Dirsch O., Holzh&uuml;tter HG., <b>K&ouml;nig M.</b><br>
<i>On the Influence of Growth in Perfusion Dependent Biological Systems - at the Example of the Human Liver.</i><br>
PAMM 15 (1), 119-120, 2015 
[<a href="http://onlinelibrary.wiley.com/doi/10.1002/pamm.201510050/abstract;jsessionid=381EE9FEDFD3E8AACF0647465168F845.f02t03">doi:10.1002/pamm.201510050</a>]</td><td></td></tr>

<tr><td>2015</td><td>Somogyi ET., Bouteiller JM., Glazier JA., <b>K&ouml;nig M.</b>, Medley JK., Swat MH and Sauro HM.<br>
<i>LibRoadRunner: a high performance SBML simulation and analysis library.</i><br>
Bioinformatics. 2015 Jun 17. pii: btv363. 
[<a href="http://www.ncbi.nlm.nih.gov/pubmed/26085503" target="_blank">PubMed</a>]<br>
<a href="http://libroadrunner.org/">libRoadRunner project</a>
</td><td></td></tr>

<tr><td>2014</td><td>Ricken T., Werner D., Holzh&uuml;tter HG., <b>K&ouml;nig M.</b>, Dahmen U., Dirsch O.<br>
	<i>Modeling function-perfusion behavior in liver lobules including tissue, blood, glucose, lactate and glycogen by use of a coupled two-scale PDE-ODE approach.</i><br>
	Biomech Model Mechanobiol. 2014 Sep 19. [Epub ahead of print]
	[<a href="http://dx.doi.org/10.1007/s10237-014-0619-z">doi</a>, 
	<a href="http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=pubmed&cmd=Retrieve&dopt=AbstractPlus&list_uids=25236798"target="_blank">PubMed</a>]</td><td></td></tr>


<tr><td>2014</td><td><b>K&ouml;nig M.</b> and Holzh&uuml;tter HG.<br>
	<i>Homeostasis of blood glucose - Computer simulations of central liver functions.</i><br>
	systembiologie.de 2014; 8:p.53-57 
	[<a href="https://www.systembiologie.de/lw_resource/datapool/_items/item_14/frs-13014_systembiologie_8_2014.pdf">PDF (de)</a>, 
	<a href="https://www.systembiologie.de/lw_resource/datapool/_items/item_36/systembiologie_magazine_issue08.pdf" target="_blank">PDF (en)</a>]</td><td></td></tr>
<tr><td>2013</td><td><b>K&ouml;nig M.</b>, Holzh&uuml;tter HG., Berndt N.<br>
	<i>Metabolic Gradients as Key Regulators in Zonation of Tumor Energy Metabolism: A Tissue-scale Model Based Study.</i><br>
	Biotechnol J. 2013 Apr 16. [Epub ahead of print]
	[<a href="http://dx.doi.org/10.1002/biot.201200393">doi</a>, 
	<a href="http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=pubmed&cmd=Retrieve&dopt=AbstractPlus&list_uids=23589477"target="_blank">PubMed</a>]
</td><td></td></tr>
<tr><td>2012</td><td><b>K&ouml;nig M.</b> and Holzh&uuml;tter HG.<br>
	<i>Kinetic Modeling of Human Hepatic Glucose Metabolism in T2DM Predicts Higher Risk of 
Hypoglycemic Events in Rigorous Insulin Therapy</i><br>
	 J Biol Chem. 2012  [<a href="http://www.jbc.org/content/early/2012/09/12/jbc.M112.382069" target="_blank">DOI 10.1074/jbc.M112.382069</a>]</td><td></td></tr>

<tr><td>2012</td><td><b>K&ouml;nig M.</b>, Dr&auml;ger A. and Holzh&uuml;tter HG.<br>
	 <i>CySBML: a Cytoscape plugin for SBML</i><br>
	  Bioinformatics.  2012 Jul 5. [<a href="http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=pubmed&cmd=Retrieve&dopt=AbstractPlus&list_uids=22772946" target="_blank">PubMed</a>]<br>
	  <a href="http://matthiaskoenig.github.io/cy2sbml/" target="_blank">cy2sbml project</a></td><td></td></tr>

<tr><td>2012</td><td><b>K&ouml;nig M.</b>, Bulik S. and Holzh&uuml;tter HG.<br>
	 <i>Quantifying the Contribution of the Liver to the Homeostasis of Plasma Glucose: A Detailed Kinetic Model of Hepatic Glucose Metabolism Integrated with the Hormonal Control by Insulin, Glucagon and Epinephrine</i><br>
	  PLoS Comput Biol. 2012 Jun;8(6):e1002577. Epub 2012 Jun 21. [<a href="http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=pubmed&cmd=Retrieve&dopt=AbstractPlus&list_uids=22761565" target="_blank">PubMed</a>]</td><td></td></tr>	  	  
<tr><td>2011</td><td>Herling A, <b>K&ouml;nig M</b>, Bulik S, Holzh&uuml;tter HG.<br>
	<i>Enzymatic Features of the Glucose Metabolism in Tumor Cells.</i><br>
	FEBS J. 2011 Jul;<b>278</b>(14):2436-59. 
	[<a href="http://dx.doi.org/10.1111/j.1742-4658.2011.08174.x">doi</a>, 
	<a href="http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=pubmed&cmd=Retrieve&dopt=AbstractPlus&list_uids=21564549">PubMed</a>]
<tr><td>2010</td><td><b>K&ouml;nig M.</b> and Holzh&uuml;tter HG.<br>
	<i>FluxViz - Cytoscape Plug-in for Vizualisation of Flux Distributions in Networks</i><br>
	  Genome Informatics 2010, Vol.24, p.96-103 [<a href="http://www.ncbi.nlm.nih.gov/pubmed?term=22081592" target="_blank">PubMed</a>]<br><a href="http://matthiaskoenig.github.io/cy2fluxviz/" target="_blank">cy2fluxviz project</a></td><td><a href="./paper/FluxViz_Koenig2010.pdf" target="_blank"><img src="./images/pdf.jpeg">
	 </td></tr>
<tr><td>2010</td><td><p>Gille C, B&ouml;lling C, Hoppe A, Bulik S, Hoffmann S, H&uuml;bner K, Karlst&auml;dt A, Ganeshan R, <b>K&ouml;nig M</b>, Rother K, Weidlich M, Behre J, Holzh&uuml;tter HG.<br>
   <i>HepatoNet1: a comprehensive metabolic reconstruction of the human hepatocyte for the analysis of liver physiology.</i><br>
     Mol Syst Biol., <b>6</b>:411. [<a href="http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=pubmed&cmd=Retrieve&dopt=AbstractPlus&list_uids=20823849" target="_blank">PubMed</a>]</td><td><a href="./paper/Gille2010.pdf" target="_blank"><img src="./images/pdf.jpeg"></td></tr>
</table>


You can find the source code of this page at
{% include icon-github.html username="matthiaskoenig" %} /
[livermetabolism-site](https://github.com/matthiaskoenig/livermetabolism-site)
