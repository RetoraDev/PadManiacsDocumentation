(function (global) {
  "use strict";

  class DokiDocs {
    constructor() {
      this.version = "1.0.0";
      this.tags = {};
      this.init();
    }

    init() {
      // Register default tags
      this.registerDefaultTags();
    }

    registerDefaultTags() {
      this.tags = {
        // Simple tags
        title: (content, args) => this.createTag("doki-title", content, args),
        heading: (content, args) => this.createTag("doki-heading", content, args),
        subheading: (content, args) => this.createTag("doki-subheading", content, args),
        p: (content, args) => this.createTag("doki-paragraph", content, args),
        paragraph: (content, args) => this.createTag("doki-paragraph", content, args),
        code: (content, args) => this.createInlineCode(content, args),
        link: (content, args) => this.createLink(content, args),
        img: (content, args) => this.createImage(content, args),
        image: (content, args) => this.createImage(content, args),
        video: (content, args) => this.createVideo(content, args),
        iframe: (content, args) => this.createIframe(content, args),
        citation: (content, args) => this.createTag("doki-citation", content, args),
        credit: (content, args) => this.createTag("doki-credit", content, args),
        footer: (content, args) => this.createTag("doki-footer", content, args),
        tab: (content, args) => this.createTag("doki-tab", content, args),
        frame: (content, args) => this.createTag("doki-frame", content, args),
        note: (content, args) => this.createTag("doki-note", content, args),
        warning: (content, args) => this.createTag("doki-warning", content, args),
        danger: (content, args) => this.createTag("doki-danger", content, args),

        // Block tags
        codeblock: (content, args) => this.createCodeBlock(content, args),
        table: (content, args) => this.createTable(content, args),
        list: (content, args) => this.createList(content, args)
      };
    }

    createTag(tagName, content, args = []) {
      const element = document.createElement(tagName);
      element.innerHTML = this.processContent(content);

      // Add arguments as data attributes
      args.forEach((arg, index) => {
        if (arg.includes("=")) {
          const [key, value] = arg.split("=");
          element.setAttribute(`data-${key}`, value);
        } else {
          element.setAttribute(`data-arg-${index}`, arg);
        }
      });

      return element;
    }

    createInlineCode(content, args) {
      const element = this.createCodeBlock(content, args, true);

      return element;
    }

    createCodeBlock(content, args, inline) {
      const element = document.createElement("doki-code-block-container");
      
      const block = document.createElement(inline ? "doki-inline-code" : "doki-code-block");
      
      const code = document.createElement("code");
      
      if (inline) {
        code.textContent = content;
      } else {
        // Normalize indentation by removing common leading whitespace
        const normalizedContent = this.normalizeCodeBlock(content);
        code.textContent = normalizedContent;
      }

      if (args.length > 0) {
        code.className = `language-${args[0]}`;
      }

      code.className += " prettyprint";
      code.setAttribute("translate", "no");
      
      block.appendChild(code);
      
      element.inline = inline || false;
      
      element.appendChild(block);
      
      return element;
    }
    
    normalizeCodeBlock(content) {
      if (!content) return '';
      
      let lines = content.split('\n');
      
      // Trim empty lines from start and end
      while (lines.length > 0 && lines[0].trim() === '') {
        lines.shift();
      }
      while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
        lines.pop();
      }
      
      if (lines.length === 0) return '';
      
      // Special case: if we only have one line, just trim it
      if (lines.length === 1) {
        return lines[0].trim();
      }
      
      // Find the minimum indentation from non-empty lines (excluding the very first line)
      let minIndent = Infinity;
      for (let i = 1; i < lines.length; i++) { // Start from second line
        const line = lines[i];
        if (line.trim().length === 0) continue;
        const indent = line.match(/^[ \t]*/)[0].length;
        if (indent < minIndent) {
          minIndent = indent;
        }
      }
      
      // If we didn't find any indentation in subsequent lines, use the first line's indentation
      if (minIndent === Infinity) {
        minIndent = lines[0].match(/^[ \t]*/)[0].length;
      }
      
      // Ensure we don't remove more characters than any line has
      const normalizedLines = lines.map(line => {
        if (!line.startsWith(" ")) return line;
        
        if (line.trim().length === 0) {
          return line;
        }
        // Only remove up to the actual length of the line
        const removeCount = Math.min(minIndent, line.length);
        return line.substring(removeCount);
      });
      
      return normalizedLines.join('\n');
    }    
    
    createList(content, args) {
      const element = document.createElement('doki-list');
      const items = content.trim().split('\n').filter(item => item.trim());
      
      // Determine list type and format
      const firstItem = items[0]?.trim() || '';
      let listType = 'unordered';
      let bulletType = '*';
      let numberFormat = '#.';
      
      // Detect list type from first item
      if (firstItem.match(/^\d+[\.\)\-]/)) {
        listType = 'ordered';
        
        // Detect number format
        if (firstItem.match(/^\d+\./)) {
          numberFormat = '#.';
        } else if (firstItem.match(/^\d+\)\./)) {
          numberFormat = '(#).';
        } else if (firstItem.match(/^\d+\)/)) {
          numberFormat = '(#)';
        } else if (firstItem.match(/^\d+\)-/)) {
          numberFormat = '(#)-';
        } else if (firstItem.match(/^\d+-/)) {
          numberFormat = '#-';
        }
      } else {
        // Detect bullet type for unordered lists
        const firstChar = firstItem.charAt(0);
        if (['-', '•', '*', '~'].includes(firstChar)) {
          bulletType = firstChar;
        }
      }
      
      element.setAttribute('data-type', listType);
      if (listType === 'unordered') {
        element.setAttribute('data-bullet', bulletType);
      } else {
        element.setAttribute('data-format', numberFormat);
      }
      
      // Process list items
      items.forEach(item => {
        const listItem = document.createElement('doki-list-item');
        
        // Remove the bullet/number prefix and trim
        let itemContent = item.trim();
        if (listType === 'unordered') {
          itemContent = itemContent.substring(1).trim();
        } else {
          itemContent = itemContent.replace(/^(\d+[\.\)\-]\s*)/, '').trim();
        }
        
        listItem.innerHTML = this.processContent(itemContent);
        element.appendChild(listItem);
      });
      
      return element;
    }

    createLink(content, args) {
      const element = document.createElement("doki-link");
      element.textContent = content;

      let href = content;
      if (args.length > 0) {
        href = args[0];
      }

      element.addEventListener("click", () => {
        if (href.startsWith("#")) {
          // Internal link
          const target = document.querySelector(href);
          if (target) target.scrollIntoView({ behavior: "smooth" });
        } else {
          // External link
          window.open(href, "_blank");
        }
      });

      return element;
    }

    createImage(content, args) {
      const element = document.createElement("doki-image");
      const image = document.createElement("img");
      image.src = content;

      args.forEach(arg => {
        if (arg.startsWith("width=")) {
          element.style.width = arg.split("=")[1];
        } else if (arg.startsWith("height=")) {
          element.style.height = arg.split("=")[1];
        } else if (arg.startsWith("alt=")) {
          image.alt = arg.split("=")[1];
        }
      });
      
      element.appendChild(image);

      return element;
    }

    createVideo(content, args) {
      const element = document.createElement("doki-video");
      const video = document.createElement("video");
      video.src = content;
      video.controls = true;

      args.forEach(arg => {
        if (arg.startsWith("width=")) {
          video.style.width = arg.split("=")[1];
        } else if (arg.startsWith("height=")) {
          video.style.height = arg.split("=")[1];
        } else if (arg === "autoplay") {
          video.autoplay = true;
        } else if (arg === "loop") {
          video.loop = true;
        } else if (arg === "muted") {
          video.muted = true;
        }
      });

      element.appendChild(video);
      return element;
    }

    createIframe(content, args) {
      const element = document.createElement("doki-iframe");
      const iframe = document.createElement("iframe");
      iframe.src = content;

      args.forEach(arg => {
        if (arg.startsWith("width=")) {
          iframe.style.width = arg.split("=")[1];
        } else if (arg.startsWith("height=")) {
          iframe.style.height = arg.split("=")[1];
        } else if (arg.startsWith("title=")) {
          iframe.title = arg.split("=")[1];
        }
      });

      element.appendChild(iframe);
      return element;
    }

    createTable(content, args) {
      // Create container for horizontal scrolling
      const container = document.createElement('doki-table-container');
      const element = document.createElement('doki-table');
      
      const rows = content.trim().split('\n');
      
      rows.forEach((row, rowIndex) => {
        const rowElement = document.createElement('doki-table-row');
        const cells = row.trim().slice(1, -1).split('|').map(cell => cell.trim());
        
        cells.forEach((cell, cellIndex) => {
          let cellElement;
          
          if (rowIndex === 0 && args.includes('header')) {
            cellElement = document.createElement('doki-table-header');
          } else {
            cellElement = document.createElement('doki-table-cell');
          }
          
          cellElement.innerHTML = this.processContent(cell);
          rowElement.appendChild(cellElement);
        });
        
        element.appendChild(rowElement);
      });
      
      container.appendChild(element);
      return container;
    }

    processContent(content) {
      // Process nested Doki tags in content
      return this.parseInlineTags(content);
    }

    parseInlineTags(text) {
      return text.replace(/\[([^\]:]+):\s*"([^"]*)"\s*([^\]]*)\]/g, (match, tagName, content, argsStr) => {
        const args = argsStr
          .trim()
          .split(/\s+/)
          .filter(arg => arg);

        if (this.tags[tagName]) {
          const element = this.tags[tagName](content, args);
          return element.outerHTML;
        }

        return match;
      });
    }

    parseBlockTags(html) {
      const blockRegex = /\[(\w+)([^\]]*)\]([\s\S]*?)\[\/\1\]/g;

      return html.replace(blockRegex, (match, tagName, argsStr, content) => {
        const args = argsStr
          .trim()
          .split(/\s+/)
          .filter(arg => arg);

        if (this.tags[tagName]) {
          const element = this.tags[tagName](content.trim(), args);
          return element.outerHTML;
        }

        return match;
      });
    }

    parse(html) {
      let result = this.parseBlockTags(html);
      result = this.parseInlineTags(result);
      return result;
    }

    processElement(element = document.body) {
      const html = element.innerHTML;
      element.innerHTML = this.parse(html);
      this.applySyntaxHighlighting();
    }

    applySyntaxHighlighting() {
      // Get the script element that loaded doki-docs.js
      const scripts = document.getElementsByTagName('script');
      let scriptPath = '';
      
      // Find the doki-docs.js script to get its location
      for (let i = 0; i < scripts.length; i++) {
        const src = scripts[i].src;
        if (src && src.includes('doki-docs.js')) {
          scriptPath = src.substring(0, src.lastIndexOf('/') + 1);
          break;
        }
      }
      
      const loadPrettify = (basePath) => {
        // Load prettify.js dynamically
        const styleBase = document.createElement('link');
        styleBase.href = basePath + 'prettify/prettify.css';
        styleBase.rel = 'stylesheet';
    
        const styleCustom = document.createElement('link');
        styleCustom.href = basePath + 'prettify/theme.css';
        styleCustom.rel = 'stylesheet';
    
        document.head.appendChild(styleBase);
        document.head.appendChild(styleCustom);
    
        const prettify = document.createElement('script');
        prettify.src = basePath + 'prettify/prettify.js';
    
        prettify.onload = () => {
          const elements = document.getElementsByTagName('code');
          
          for (let i = 0; i < elements.length; i++) {
            const e = elements[i];
            e.className += ' prettyprint';
            e.setAttribute('translate', 'no');
          }
          
          this.attachCopyButtons();
        };
    
        prettify.onerror = () => {
          console.warn('Failed to load prettify from local path, trying CDN fallback...');
          // Fallback to CDN
          loadPrettify('https://cdn.jsdelivr.net/gh/google/code-prettify@master/loader/');
        };
    
        document.head.appendChild(prettify);
      };
    
      // Start loading from script location
      if (scriptPath) {
        loadPrettify(scriptPath);
      } else {
        // Fallback to current directory
        loadPrettify('./');
      }
    }
    
    attachCopyButtons() {
      const codeBlocks = document.querySelectorAll('doki-code-block-container');
      codeBlocks.forEach(block => {
        if (block.querySelector('doki-code-block') && block.querySelector('code')) {
          const code = block.querySelector('code');
          if (code) {
            const content = code.textContent;
            const copyButton = document.createElement('button');
            copyButton.className = 'doki-copy-button';
            copyButton.textContent = 'Copy';
            copyButton.setAttribute('aria-label', 'Copy code to clipboard');
            
            copyButton.addEventListener('click', async () => {
              try {
                await navigator.clipboard.writeText(content);
                copyButton.textContent = 'Copied!';
                copyButton.classList.add('copied');
                
                setTimeout(() => {
                  copyButton.textContent = 'Copy';
                  copyButton.classList.remove('copied');
                }, 500);
              } catch (err) {
                console.error('Failed to copy code: ', err);
               }
            });
            
            block.appendChild(copyButton);
          }
        }
      });
    }

    registerTag(tagName, handler) {
      this.tags[tagName] = handler;
    }

    // Node.js compatibility
    static init() {
      if (typeof window !== "undefined") {
        window.DokiDocs = DokiDocs;

        // Auto-initialize when DOM is ready
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", () => {
            const doki = new DokiDocs();
            doki.processElement();
            document.body.classList.remove("doki-hidden");
          });
        } else {
          const doki = new DokiDocs();
          doki.processElement();
          document.body.classList.remove("doki-hidden");
        }
      }
      return DokiDocs;
    }
  }

  // Export for different environments
  if (typeof module !== "undefined" && module.exports) {
    module.exports = DokiDocs;
  } else if (typeof define === "function" && define.amd) {
    define([], () => DokiDocs);
  } else {
    global.DokiDocs = DokiDocs;
    DokiDocs.init();
  }
})(typeof window !== "undefined" ? window : global);
