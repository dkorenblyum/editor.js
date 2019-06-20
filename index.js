import EditorJS from '@editorjs/editorjs';
import Quote from '@editorjs/quote';

let nodes = {
  button: null,
  wrapper: null,
  input: null,
  checkbox: null
};

let CSS = {
  button: 'ce-inline-tool',
  buttonActive: 'ce-inline-tool--active',
  buttonModifier: 'ce-inline-tool--link',
  buttonUnlink: 'ce-inline-tool--unlink',
  input: 'ce-inline-tool-input',
  inputShowed: 'ce-inline-tool-input--showed',
  hidden: 'hidden'
};

function svg(name, width, height) {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  icon.classList.add('icon', 'icon--' + name);
  icon.setAttribute('width', width + 'px');
  icon.setAttribute('height', height + 'px');
  icon.innerHTML = `<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#${name}"></use>`;

  return icon;
}

class LinkInlineTool {

  static get isInline() {
    return true;
  }

  static get sanitize() {
    return {
      a: {
        href: true,
        target: '_blank',
        rel: 'nofollow',
      },
    };
  }

  constructor({data, api}) {
    this.toolbar = api.toolbar;
    this.selection = api.selection;
    this.inlineToolbar = api.inlineToolbar;
    this.notifier = api.notifier;
    this.selection = api.selection;
    this.CSS = CSS;
    this.nodes = nodes;
    this.svg = svg;
    this.linkWrapperShowing = false;
    this.ENTER_KEY = 13;
    this.commandLink = 'createLink';
    this.commandUnlink = 'unlink';
    this.tag = 'A';
  }

  render() {
    this.nodes.button = document.createElement('button');
    this.nodes.button.type = 'button';
    this.nodes.button.classList.add(this.CSS.button, this.CSS.buttonModifier);
    this.nodes.button.appendChild(this.svg('link', 15, 14));
    return this.nodes.button;
  }

  renderActions() {
    this.nodes.wrapper = document.createElement('div');
    this.nodes.wrapper.classList.add(this.CSS.hidden);

    this.nodes.wrapper.addEventListener('keydown', (event) => {
      if (event.keyCode === this.ENTER_KEY) {
        this.enterPressed(event);
      }
    });

    this.nodes.input = document.createElement('input');
    this.nodes.input.placeholder = 'Add a link';

    this.nodes.checkbox = document.createElement('input');
    this.nodes.checkbox.type = "checkbox";
    this.nodes.checkbox.name = "name";

    this.nodes.wrapper.appendChild(this.nodes.input);
    this.nodes.wrapper.appendChild(this.nodes.checkbox);
    return this.nodes.wrapper;
  }

  toggleDisplay() {
    if (this.linkWrapperShowing) {
      this.nodes.wrapper.classList.add(this.CSS.hidden);
      this.linkWrapperShowing = false;
    } else {
      this.nodes.wrapper.classList.remove(this.CSS.hidden);
      this.linkWrapperShowing = true;
    }
  }
  surround(range) {
    if (range) {
      this.range = range;
    }

    this.toggleDisplay();
  }


  checkState() {
    const anchorTag = this.selection.findParentTag('A');

    if (anchorTag) {
      this.nodes.button.classList.add(this.CSS.buttonUnlink);
      this.nodes.button.classList.add(this.CSS.buttonActive);
      const hrefAttr = anchorTag.getAttribute('href');
      this.nodes.input.value = hrefAttr !== 'null' ? hrefAttr : '';

    } else {
      this.nodes.button.classList.remove(this.CSS.buttonUnlink);
      this.nodes.button.classList.remove(this.CSS.buttonActive);
    }

    return !!anchorTag;

  }

  validateURL(str) {
    return !/\s/.test(str);
  }

  prepareLink(link) {
    link = link.trim();
    link = this.addProtocol(link);
    return link;
  }

  addProtocol(link) {
    if (/^(\w+):\/\//.test(link)) {
      return link;
    }
    const isInternal = /^\/[^\/\s]/.test(link),
      isAnchor = link.substring(0, 1) === '#',
      isProtocolRelative = /^\/\/[^\/\s]/.test(link);

    if (!isInternal && !isAnchor && !isProtocolRelative) {
      link = 'http://' + link;
    }

    return link;
  }

  collapseToEnd() {
    const sel = window.getSelection();
    const range = document.createRange();

    range.selectNodeContents(sel.focusNode);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  enterPressed(event) {
    let linkValue = this.nodes.input.value || '';
    let nofollow = this.nodes.checkbox.checked;

    if (!linkValue.trim()) {
      event.preventDefault();
    }

    if (!this.validateURL(linkValue)) {

      this.notifier.show({
        message: 'Pasted link is not valid.',
        style: 'error',
      });

      _.log('Incorrect Link pasted', 'warn', linkValue);
      return;
    }

    linkValue = this.prepareLink(linkValue, nofollow);

    this.insertLink(linkValue, nofollow);
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.collapseToEnd();
    this.inlineToolbar.close();
  }

  insertLink(link, nofollow) {
    const selectionObject = this.range.extractContents();
    const mark = document.createElement(this.tag);
    mark.href = link;
    if (nofollow) {
      mark.rel = 'nofollow'
    }
    mark.innerText = selectionObject.textContent;
    this.range.insertNode(mark);

    this.selection.expandToTag(mark);
  }
}
const editor = new EditorJS({
  tools: {
   link: {
      class: LinkInlineTool,
      shortcut: 'CMD+SHIFT+M',
    },
    quote: {
        class: Quote,
        inlineToolbar: true,
        shortcut: 'CMD+SHIFT+O',
        config: {
          quotePlaceholder: 'Enter a quote',
          captionPlaceholder: 'Quote\'s author',
        }
    }
  }
})

let saveBtn = document.querySelector('button');

saveBtn.addEventListener('click', function() {
  editor.save().then((outputData) => {
    console.log('Article data: ', outputData);
  }).catch((error) => {
    console.log('Saving failed: ', error);
  })
})
