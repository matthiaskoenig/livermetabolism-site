#import "@preview/fontawesome:0.6.0": *
#import "@preview/linguify:0.4.1": *

// const color
#let color-darknight = rgb("#131A28")
#let color-darkgray = rgb("#333333")
#let color-gray = rgb("#5d5d5d")
#let default-accent-color = rgb("#262F99")
#let default-location-color = rgb("#333333")

// const icons
#let linkedin-icon = box(fa-icon("linkedin", fill: color-darknight),)
#let github-icon = box(
  fa-icon("github", fill: color-darknight),
)
#let researchgate-icon = box(
  fa-icon("researchgate", fill: color-darknight),
)
#let gitlab-icon = box(
  fa-icon("gitlab", fill: color-darknight),
)
#let bitbucket-icon = box(
  fa-icon("bitbucket", fill: color-darknight),
)
#let twitter-icon = box(
  fa-icon("twitter", fill: color-darknight),
)
#let google-scholar-icon = box(
  fa-icon("google-scholar", fill: color-darknight),
)
#let orcid-icon = box(
  fa-icon("orcid", fill: color-darknight),
)
#let youtube-icon = box(
  fa-icon("youtube", fill: color-darknight),
)
#let phone-icon = box(fa-icon("square-phone", fill: color-darknight))
#let email-icon = box(fa-icon("envelope", fill: color-darknight))
#let birth-icon = box(fa-icon("cake", fill: color-darknight))
#let homepage-icon = box(fa-icon("home", fill: color-darknight))
#let website-icon = box(fa-icon("globe", fill: color-darknight))
#let link-icon = box(fa-icon("globe", fill: color-darknight))

#let accent-color = default-accent-color
#let colored-headers = false

#show table.cell.where(y: 0): strong
#set table(
  stroke: (x, y) => if y == 0 {
    (bottom: 0.7pt + black)
  }
)

#let accent-color = default-accent-color
#let colored-headers = false

/// Show a link with an icon, specifically for Github projects
/// *Example*
/// #example(`resume.github-link("DeveloperPaul123/awesome-resume")`)
/// - github-path (string): The path to the Github project (e.g. "DeveloperPaul123/awesome-resume")
/// -> none
#let github-link(github-path) = {
  set box(height: 11pt)
  
  align(right + horizon)[
    #fa-icon("github", fill: color-darkgray) #link(
      "https://github.com/" + github-path,
      github-path,
    )
  ]
}



// layout utility
#let __justify_align(left_body, right_body) = {
  block[
    #left_body
    #box(width: 1fr)[
      #align(right)[
        #right_body
      ]
    ]
  ]
}

/// Right section for the justified headers
/// - body (content): The body of the right header
#let secondary-right-header(body) = {
  set text(
    size: 11pt,
    weight: "medium",
  )
  body
}

/// Right section of a tertiaty headers.
/// - body (content): The body of the right header
#let tertiary-right-header(body) = {
  set text(
    weight: "light",
    size: 9pt,
  )
  body
}

/// Justified header that takes a primary section and a secondary section. The primary section is on the left and the secondary section is on the right. This is a smaller header compared to the `justified-header`.
/// - primary (content): The primary section of the header
/// - secondary (content): The secondary section of the header
#let secondary-justified-header(primary, secondary) = {
  __justify_align[
    === #primary
  ][
    #tertiary-right-header[#secondary]
  ]
}

/// Justified header that takes a primary section and a secondary section. The primary section is on the left and the secondary section is on the right.
/// - primary (content): The primary section of the header
/// - secondary (content): The secondary section of the header
#let justified-header(primary, secondary) = {
  set block(
    above: 0.7em,
    below: 0.7em,
  )
  pad[
    #__justify_align[
      == #primary
    ][
      #secondary-right-header[#secondary]
    ]
  ]
}



/// The base item for resume entries. This formats the item for the resume entries. Typically your body would be a bullet list of items. Could be your responsibilities at a company or your academic achievements in an educational background section.
/// - title (string): The title of the resume entry
/// - location (string): The location of the resume entry
/// - date (string): The date of the resume entry, this can be a range (e.g. "Jan 2020 - Dec 2020")
/// - description (content): The body of the resume entry
/// - title-link (string): The link to use for the title (can be none)
/// - accent-color (color): Override the accent color of the resume-entry
/// - location-color (color): Override the default color of the "location" for a resume entry.
#let resume-entry(
  title: none,
  location: "",
  date: "",
  description: "",
  title-link: none,
  accent-color: default-accent-color,
  location-color: default-location-color,
) = {
  let title-content
  if type(title-link) == "string" {
    title-content = link(title-link)[#title]
  } else {
    title-content = title
  }
  block(above: 1em, below: 0.65em)[
    #pad[
      #justified-header(title-content, location)
      #if description != "" or date != "" [
        #secondary-justified-header(description, date)
      ]
    ]
  ]
}

/// The base item for resume entries.
/// This formats the item for the resume entries. Typically your body would be a bullet list of items. Could be your responsibilities at a company or your academic achievements in an educational background section.
/// - body (content): The body of the resume entry
#let resume-item(body) = {
  set text(
    size: 10pt,
    style: "normal",
    weight: "light",
    fill: color-darknight,
  )
  set block(
    above: 0.75em,
    below: 1.25em,
  )
  set par(leading: 0.65em)
  block(above: 0.5em)[
    #body
  ]
}

#let resume-skill-item(category, items) = {
  set block(below: 0.65em)
  set pad(top: 2pt)
  
  pad[
    #grid(
      columns: (30fr, 70fr),
      gutter: 10pt,
      align(left)[
        #set text(hyphenate: false)
        == #category
      ],
      align(left)[
        #set text(
          size: 11pt,
          style: "normal",
          weight: "light",
        )
        #items.join(", ")
      ],
    )
  ]
}

/// ---- Resume Template ----

/// Resume template that is inspired by the Awesome CV Latex template by posquit0. This template can loosely be considered a port of the original Latex template.
///
/// The original template: https://github.com/posquit0/Awesome-CV
///
/// - author (content): Structure that takes in all the author's information
/// - profile-picture (image): The profile picture of the author. This will be cropped to a circle and should be square in nature.
/// - date (string): The date the resume was created
/// - accent-color (color): The accent color of the resume
/// - colored-headers (boolean): Whether the headers should be colored or not
/// - language (string): The language of the resume, defaults to "en". See lang.toml for available languages
/// - body (content): The body of the resume
/// -> none
#let resume(
  author: (:),
  profile-picture: image,
  date: datetime.today().display("[month repr:long] [day], [year]"),
  accent-color: default-accent-color,
  colored-headers: true,
  show-footer: true,
  language: "en",
  font: ("Source Sans Pro", "Source Sans 3"),
  header-font: ("Roboto"),
  paper-size: "a4",
  body,
) = {
  if type(accent-color) == "string" {
    accent-color = rgb(accent-color)
  }
  
  let lang_data = toml("lang.toml")

  show: body => context {
    set document(
      author: author.firstname + " " + author.lastname,
      title: "Curriculum Vitae - Dr. Matthias König",
    )
    body
  }

  set text(
    font: font,
    lang: language,
    size: 11pt,
    fill: color-darkgray,
    fallback: true,
  )
  
  set page(
    paper: paper-size,
    margin: (left: 15mm, right: 15mm, top: 10mm, bottom: 10mm),
    footer: if show-footer [#__resume_footer(
        author,
        language,
        lang_data,
        date,
      )] else [],
    footer-descent: 0pt,
  )
  
  // set paragraph spacing
  set par(
    spacing: 0.75em,
    justify: true,
  )
  
  set heading(
    numbering: none,
    outlined: false,
  )
  
  show heading.where(level: 1): it => [
    #set text(
      size: 16pt,
      weight: "regular",
    )
    #set align(left)
    #set block(above: 1em)
    #let color = if colored-headers {
      accent-color
    } else {
      color-darkgray
    }
    #text[#strong[#text(color)[#it.body]]]
    #box(width: 1fr, line(length: 100%))
  ]
  
  show heading.where(level: 2): it => {
    set text(
      color-darkgray,
      size: 12pt,
      style: "normal",
      weight: "bold",
    )
    it.body
  }
  
  show heading.where(level: 3): it => {
    set text(
      size: 10pt,
      weight: "regular",
    )
    smallcaps[#it.body]
  }
  
  let name = {
    align(center)[
      #pad(bottom: 5pt)[
        #block[
          #set text(
            size: 32pt,
            style: "normal",
            font: header-font,
          )
          #if language == "zh" or language == "ja" [
            #text(
              accent-color,
              weight: "thin",
            )[#author.firstname]#text(weight: "bold")[#author.lastname]
          ] else [
            #if "title" in author [#text(accent-color, size: 20pt, weight: "thin")[#author.title]]
            #text(accent-color, weight: "thin")[#author.firstname]
            #text(weight: "bold")[#author.lastname]
          ]
        ]
      ]
    ]
  }
  
  let positions = {
    set text(
      accent-color,
      size: 9pt,
      weight: "regular",
    )
    align(center)[
      #smallcaps[
        #author.positions.join(
          text[#"  "#sym.dot.c#"  "],
        )
      ]
    ]
  }
  
  let address = {
    set text(
      size: 9pt,
      weight: "regular",
    )
    align(center)[
      #if ("address" in author) [
        #author.address
      ]
    ]
  }
  
  let contacts = {
    set box(height: 9pt)
    
    let separator = box(width: 5pt)
    
    align(center)[
      #set text(
        size: 9pt,
        weight: "regular",
        style: "normal",
      )
      #block[
        #align(horizon)[
          #if ("homepage" in author) [
            #separator
            #homepage-icon
            #box[#link(author.homepage)[#author.homepage]]
            
          ]
          #if ("email" in author) [
            #email-icon
            #box[#link("mailto:" + author.email)[#author.email]]
            #separator
          ]
          #if ("birth" in author) [
            #birth-icon
            #box[#text(author.birth)]
            #separator
          ]
          #if ("phone" in author) [
            #phone-icon
            #box[#text(author.phone)]
            #separator
          ]
          #if ("github" in author) [
            #github-icon
            #box[#link("https://github.com/" + author.github)[#author.github]]
          ]
          #if ("gitlab" in author) [
            #separator
            #gitlab-icon
            #box[#link("https://gitlab.com/" + author.gitlab)[#author.gitlab]]
          ]
          #if ("bitbucket" in author) [
            #separator
            #bitbucket-icon
            #box[#link("https://bitbucket.org/" + author.bitbucket)[#author.bitbucket]]
          ]
          #if ("linkedin" in author) [
            #separator
            #linkedin-icon
            #box[
              #link("https://www.linkedin.com/in/" + author.linkedin)[#author.firstname #author.lastname]
            ]
          ]
          #if ("twitter" in author) [
            #separator
            #twitter-icon
            #box[#link("https://twitter.com/" + author.twitter)[\@#author.twitter]]
          ]
          #if ("scholar" in author) [
            
            #let fullname = str(author.firstname + " " + author.lastname)
            #separator
            #google-scholar-icon
            #box[#link("https://scholar.google.com/citations?user=" + author.scholar)[#fullname]]
          ]
          #if ("orcid" in author) [
            #separator
            #orcid-icon
            #box[#link("https://orcid.org/" + author.orcid)[#author.orcid]]
          ]
          #if ("youtube" in author) [
            #separator
            #youtube-icon
            #box[#link("https://www.youtube.com/" + author.youtube)[#author.youtube]]
          ]
          #if ("researchgate" in author) [
            #let fullname = str(author.firstname + " " + author.lastname)
            #separator
            #researchgate-icon
            #box[#link("https://www.researchgate.net/profile/" + author.researchgate)[#fullname]]
          ]
          #if ("website" in author) [
            #separator
            #website-icon
            #box[#link(author.website)[#author.website]]
          ]
        ]
      ]
    ]
  }
  
  if profile-picture != none {
    grid(
      columns: (100% - 4cm, 4cm),
      rows: (100pt),
      gutter: 10pt,
      [
        #name
        #positions
        #address
        #contacts
      ],
      align(left + horizon)[
        #block(
          clip: true,
          stroke: 0pt,
          radius: 2cm,
          width: 4cm,
          height: 4cm,
          [
            #image(profile-picture, width: 100%)
          ],
        )
      ],
    )
  } else {
    name
    positions
    address
    contacts
  }

  body

  v(6mm)
  grid(
    columns: 2,
    gutter: 15mm,
    [
      *Prof. Dr. rer. nat. Matthias König* \
      Lübeck, 16. October 2026
    ],
    [
      #image("images/koenig_signature.png", width: 3.5cm)
    ]
  )
  
}