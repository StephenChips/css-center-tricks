import '../assets/CodePane.css';
import split from 'split.js';
import hljs from 'highlight.js';
import prettier, { doc } from 'prettier';
import escapeHTML from 'escape-html';

class CodePane {
    /**
     * 
     * @param {Element} el HTML Element of CodePane
     */
    constructor (el) {
        this._el = el;
        this._currentExampleKey = null;

        if (this._el.children.length > 0) {
            let firstChild = this._el.children[0];
            let key = firstChild.dataset.key;
            this._initSplitViews();
            this._initCodeHighlight();
            this.showExample(key);
        }
    }

    showExample (exampleKey) {
        if (exampleKey === this._currentExampleKey) {
            return;
        }

        let newActivedExample = this._findExampleByKey(exampleKey);
        if (newActivedExample === null) {
            throw new Error('The pane does not exists');
        }

        // If the codepane is under construction, or if there are 
        // no examples in an codepane, `this._currentExampleKey` will be null.
        if (this._currentExampleKey !== null) {
            let oldActivedExample = this._findExampleByKey(this._currentExampleKey);
            oldActivedExample.classList.remove('actived');
        }

        newActivedExample.classList.add('actived');
        this._currentExampleKey = newActivedExample.dataset.key;

        this.showCode();
    }

    showCode () {
        let example = this._findExampleByKey(this._currentExampleKey);
        let code = example.querySelector('.codepane__code');
        let result = example.querySelector('.codepane__result');

        result.classList.remove('actived');
        code.classList.add('actived');
    }

    showResult () {
        let example = this._findExampleByKey(this._currentExampleKey);
        let code = example.querySelector('.codepane__code');
        let result = example.querySelector('.codepane__result');

        result.classList.add('actived');
        code.classList.remove('actived');
    }

    /**
     * Add an example to a codepane.
     * @param {string} key example's key
     * @param {{ html: string, css: object }}} param1 object specifies example's style
     */
    addExample (key, { html, css }) {
        const el = this._createExample(key, html, css);

        const scopedCSSObject = this._createScopedCSSObject(key, css);
        const strCSS = this._convertCSSObjectToString(scopedCSSObject);
        console.log(strCSS);

        const styleTag = document.createElement('style');
        styleTag.innerText = strCSS;

        this._el.appendChild(el);
        document.head.appendChild(styleTag);
    }

    _createExample (key, html, css) {
        const formattedHTML = escapeHTML(prettier.format(html, {
            parser: 'html',
            tabWidth: 4
        }));

        const formattedCSS = prettier.format(this._convertCSSObjectToString(css), {
            parser: 'css',
            tabWidth: 4
        });

        return this._parseHTML(`
            <div class="codepane__example" data-key="${key}">
                <div class="codepane__code">
                    <div class="codepane__html">
                        <pre><code>${formattedHTML.trimRight() /* There  is a line break at the end of the string. */}</code></pre>
                    </div>
                    <div class="codepane__css">
                        <pre><code>${formattedCSS.trimRight() /* There is a line break at the end of the string. */}</code></pre>
                    </div>
                </div>
                <div class="codepane__result">
                    ${html}
                </div>
            </div>`
        );
    }

    _parseHTML (str) {
        let wrapper = document.createElement('div');
        wrapper.innerHTML = str;
        return wrapper.firstElementChild;
    }

    _createScopedCSSObject (key, styleObject) {
        // We assume all rules in the style object are not scoped.
        let scopedCSSRules = Object.create(null);
        
        for (let selector in styleObject) {
            let scopedSelector = `.codepane__example[data-key="${key}"] ${selector}`;
            scopedCSSRules[scopedSelector] = Object.assign({}, styleObject[selector])
        }
        
        return scopedCSSRules;
    }

    _convertCSSObjectToString (styleObject) {
        let result = '';

        for (let selector in styleObject) {
            let styleRules = styleObject[selector];
            let strRules  = '';

            for (let property in styleRules) {
                let valueOfProperty = styleRules[property];
                strRules += `${property}: ${valueOfProperty};`;
            }

            result += `${selector} { ${strRules} }`;
        }

        return result;
    }

    _findExampleByKey (key) {
        return this._el.querySelector(`.codepane__example[data-key="${key}"]`);
    }

    _initSplitViews () {
        var codeViews = this._el.querySelectorAll('.codepane__example > .codepane__code');

        for (var view of codeViews) {
            var htmlView = view.querySelector('.codepane__html');
            var cssView = view.querySelector('.codepane__css');

            if (htmlView !== null && cssView !== null) {
                split([ htmlView, cssView ], {
                    gutterSize: 5,
                    elementStyle (dimension, size, gutterSize) {
                        return {
                            'flex-basis': 'calc(' + size + '% - ' + gutterSize + 'px)',
                        }
                    },
                    gutterStyle (dimension, gutterSize) {
                        return {
                            'flex-basis': gutterSize + 'px',
                        }
                    },
                });
            }
        }
    }

    _initCodeHighlight () {
        var codes = this._el.querySelectorAll('pre code');

        for (var el of codes) {
            hljs.highlightBlock(el);
        }
    }
}

export default CodePane;
