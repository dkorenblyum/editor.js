import EditorJS from '@editorjs/editorjs';
import Quote from '@editorjs/quote';
class InlineLink {
  static get CSS() {
    return {
      button: 'ce-inline-tool',
      buttonActive: 'ce-inline-tool--active',
      buttonModifier: 'ce-inline-tool--link',
      buttonUnlink: 'ce-inline-tool--unlink',
      input: 'ce-inline-tool-input',
      inputShowed: 'ce-inline-tool-input--showed',
    };
  }

  removeFakeBackground() {
    if (!this.isFakeBackgroundEnabled) {
      return;
    }

    this.isFakeBackgroundEnabled = false;
    document.execCommand(this.commandRemoveFormat);
  }
  setFakeBackground() {
    document.execCommand(this.commandBackground, false, '#a8d6ff');

    this.isFakeBackgroundEnabled = true;
  }
  svg(name, width, height) {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    icon.classList.add('icon', 'icon--' + name);
    icon.setAttribute('width', width + 'px');
    icon.setAttribute('height', height + 'px');
    icon.innerHTML = `<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#${name}"></use>`;

    return icon;
  }
  constructor({api}) {
    this.api = api;
    this.button = null;
    this.inputOpened = false;
    this.tag = 'CODE';
    this.commandLink = 'createLink';
    this.commandUnlink = 'unlink';
    this.isFakeBackgroundEnabled = false;
    this.commandBackground = 'backColor';
    this.commandRemoveFormat = 'removeFormat';
    this.iconClasses = {
      base: this.api.styles.inlineToolButton,
      active: this.api.styles.inlineToolButtonActive
    };
  }
  static get isInline() {
    return true;
  }
  render() {
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.classList.add(this.iconClasses.base);
    this.button.appendChild(this.svg('link', 15, 14));
    this.button.appendChild(this.svg('unlink', 16, 18));
    return this.button;
  }
  renderActions() {
    this.wrapper = document.createElement('div');

    this.input = document.createElement('input');
    this.input.placeholder = 'Add a foo';
    this.input.addEventListener('keydown', (event) => {
      if (event.keyCode === this.ENTER_KEY) {
        this.enterPressed(event);
      }
    });

    this.checkbox = document.createElement('input');
    this.checkbox.type = "checkbox";
    this.checkbox.name = "name";
    this.checkbox.value = "value";

    this.wrapper.appendChild(this.input);
    this.wrapper.appendChild(this.checkbox);

    return this.wrapper;
  }

  static get sanitize() {
    return {
      a: {
        href: true,
        target: '_blank',
        rel: 'nofollow',
      }
    }
  }

  surround(range) {
    if (range) {
      if (!this.inputOpened) {
        this.setFakeBackground();
        this.api.saver.save();
      } else {
        this.removeFakeBackground();
      }
      const parentAnchor = this.api.selection.findParentTag('A');
      if (parentAnchor) {
        this.api.selection.expandToTag(parentAnchor);
        this.unlink();
        this.closeActions();
        this.checkState();
        this.toolbar.close();
        return;
      }
    }

    this.toggleActions();
  }
  checkState() {
    const anchorTag = this.api.selection.findParentTag('A');

    if (anchorTag) {
      this.button.classList.add(InlineLink.CSS.buttonUnlink);
      this.button.classList.add(InlineLink.CSS.buttonActive);
      this.openActions();

      /**
       * Fill input value with link href
       */
      const hrefAttr = anchorTag.getAttribute('href');
      this.input.value = hrefAttr !== 'null' ? hrefAttr : '';

      this.api.selection.save();
    } else {
      this.button.classList.remove(InlineLink.CSS.buttonUnlink);
      this.button.classList.remove(InlineLink.CSS.buttonActive);
    }

    return !!anchorTag;
  }

  toggleActions() {
    if (!this.inputOpened) {
      this.openActions(true);
    } else {
      this.closeActions(false);
    }
  }
  openActions(needFocus) {
    this.input.classList.add(InlineLink.CSS.inputShowed);
    if (needFocus) {
      this.input.focus();
    }
    this.inputOpened = true;
  }
  insertLink(link) {
    const anchorTag = this.selection.findParentTag('A');

    if (anchorTag) {
      this.selection.expandToTag(anchorTag);
    }

    document.execCommand(this.commandLink, false, link);
  }
  unlink() {
    document.execCommand(this.commandUnlink);
  }
}
const editor = new EditorJS({
  tools: {
   inlineLink: {
      class: InlineLink,
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
