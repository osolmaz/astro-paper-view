# Astro Paper View

Astro Paper View is a set of Astro components for reading an article as a printable paper. It adds a title block and abstract above the same live article, with local Latin Modern fonts and zoom controls.

Interactive figures keep their listeners and form state when readers switch views. The article remains readable when JavaScript is disabled.

## Install

Requires Astro 5–7 and Node 22.12 or later. Install from GitHub, replacing `<ref>` with a commit or tag:

```sh
npm install 'github:osolmaz/astro-paper-view#<ref>'
```

## Use

Add the head component to your page's `<head>`. Wrap the article body in an element with a stable ID, then pass that ID to the viewer. Include one viewer per page.

```astro
---
import PaperView from 'astro-paper-view/PaperView.astro';
import PaperViewHead from 'astro-paper-view/PaperViewHead.astro';
import PaperViewToggle from 'astro-paper-view/PaperViewToggle.astro';

const { post } = Astro.props;
const paper = post.data.paper === true;
---

<html lang="en">
  <head>
    <PaperViewHead defaultPaper={paper} />
  </head>
  <body>
    <h1>{post.data.title}</h1>
    <PaperViewToggle />
    <div id="article-content"><slot /></div>
    <PaperView
      title={post.data.title}
      author="Your Name"
      date={post.data.date}
      contentId="article-content"
      defaultPaper={paper}
    >
      {post.data.abstract && <p slot="abstract">{post.data.abstract}</p>}
    </PaperView>
  </body>
</html>
```

Add `paper: z.boolean().optional()` and `abstract: z.string().optional()` to your content schema. Authors can then select the paper default in frontmatter:

```yaml
paper: true
abstract: A short description of the question and result.
```

With `defaultPaper` enabled, paper mode opens on viewports at least 1240 pixels wide. Smaller screens keep the normal web layout until the reader selects **Paper view**. Explicit `?view=paper` and `?view=web` links override the default. **Web view** or Escape restores the original page. **Print / PDF** prints the paper without the toolbar.

Use the optional `abstract` slot for formatted text or links. The package renders the Astro content you provide. To use Markdown in frontmatter, render it with the host site's Markdown processor before passing it to the slot. Plain text expressions remain escaped.

```astro
<PaperView title="A study" author="Your Name" contentId="article-content">
  <p slot="abstract">
    We studied the method described in <a href="/previous-study/"
      >our earlier work</a
    >.
  </p>
</PaperView>
```

Pass the title and author with the ID of the content element. Its optional `date` is a JavaScript `Date`. The optional `lang` controls the paper language and date formatting. Supply `headerSelector` if the site's navigation should remain visible inside paper view. The toggle accepts a `class` prop and a slot for its label.

Fonts load from the package through Astro's asset pipeline. No CDN or public-directory copies are required. Math rendering stays with the host site's Markdown configuration. Keep site-specific figure colors and other overrides in the host stylesheet.

## License

[MIT](LICENSE)
