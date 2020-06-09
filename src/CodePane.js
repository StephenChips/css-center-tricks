import '../assets/CodePane.css';
import split from 'split.js';
import hljs from 'highlight.js';
import prettier from 'prettier/standalone.js';
import PrettierHTMLParser from 'prettier/parser-html.js';
import PrettierCSSParser from 'prettier/parser-postcss.js';
import escapeHTML from 'escape-html';

class CodePane {
    /**
     * 
     * @param {Element} el HTML Element of CodePane
     */
    constructor (el) {
        // There are two states for a CodePane, which are the 'showing-code' state and the 'showing-result' state.
        // When it's showing the current example's HTML & CSS snippets,  it's in the 'showing-code' state.
        // When it's showing the current example's result HTML, it's in the 'showing-result' state.
        this._state = 'showing-code';
        this._el = el;
        this._currentExampleKey = null;

        if (this._el.children.length > 0) {
            let firstChild = this._el.children[0];
            let keyOfFirstExample = firstChild.dataset.key;

            // Initialize split.js for all examples.
            this._initSplitViewForAllExamples();
            // Initialize highlight.js for all examples.
            this._initHighlightForAllExamples();

            // Calling the "showExample(...)" will ends the "creating" state.
            this.showExample(keyOfFirstExample);
        }
    }

    showExample (exampleKey) {
        if (exampleKey === this._currentExampleKey) {
            return;
        }

        console.log(exampleKey)
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

        const exampleState = this._getExampleState(newActivedExample);
        if (exampleState === 'showing-code' && this._state === 'showing-result') {
            this.showResult();
        } else if (exampleState === 'showing-result' && this._state === 'showing-code') {
            this.showCode();
        }
    }

    showCode () {
        let example = this._findExampleByKey(this._currentExampleKey);
        let code = example.querySelector('.codepane__code');
        let result = example.querySelector('.codepane__result');

        result.classList.remove('actived');
        code.classList.add('actived');

        this._state = 'showing-code';
    }

    showResult () {
        let example = this._findExampleByKey(this._currentExampleKey);
        let code = example.querySelector('.codepane__code');
        let result = example.querySelector('.codepane__result');

        result.classList.add('actived');
        code.classList.remove('actived');

        this._state = 'showing-result';
    }

    /**
     * Add an example to a codepane.
     * @param {string} key example's key
     * @param {{ html: string, css: object }}} param1 object specifies example's style
     */
    addExample (key, { html, css }) {
        if (this._findExampleByKey(key) !== null) {
            throw new Error('Your example\'s key is same with an existed example.');
        }

        // create html elements and CSS from argument.
        const el = this._createElement(key, html, css);
        const scopedCSSObject = this._createScopedCSSObject(key, css);
        const strCSS = this._convertCSSObjectToString(scopedCSSObject);

        // Create <style> tag with generated CSS.
        const styleTag = document.createElement('style');
        styleTag.textContent = strCSS;

        // Initialize the active states.
        el.querySelector('.codepane__result').classList.remove('actived');
        el.querySelector('.codepane__code').classList.add('actived');

        // Insert example's element to document.
        this._el.appendChild(el);
        document.head.appendChild(styleTag);

        // Finally, initalize split.js for this new example.
        this._initSplitViewForExample(el);
        this._initHighlightForExample(el);
    }

    _getExampleState (example) {
        var elCode = example.querySelector('.codepane__code');
        if (elCode.classList.contains('actived')) {
            return 'showing-code'
        } else {
            return 'showing-result';
        }
    }

    _createElement (key, html, css) {
        const formattedHTML = escapeHTML(prettier.format(html, {
            parser: 'html',
            tabWidth: 4,
            plugins: [ PrettierHTMLParser ]
        }));

        const formattedCSS = prettier.format(this._convertCSSObjectToString(css), {
            parser: 'css',
            tabWidth: 4,
            plugins: [ PrettierCSSParser ]
        });

        return this._parseHTML(`
            <div class="codepane__example" data-key="${key}">
                <div class="codepane__code">
                    <div class="codepane__html">
                        <pre><code>${formattedHTML.trim()}</code></pre>
                    </div>
                    <div class="codepane__css">
                        <pre><code>${formattedCSS.trim()}</code></pre>
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

    _initSplitViewForExample (example) {
        let htmlView = example.querySelector('.codepane__code .codepane__html');
        let cssView = example.querySelector('.codepane__code .codepane__css');

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

    _initSplitViewForAllExamples () {
        let allExamples = this._el.querySelectorAll('.codepane__example');
        for (let example of allExamples) {
            this._initSplitViewForExample(example);
        }
    }

    _initHighlightForAllExamples () {
        const allExamples = this._el.querySelectorAll('.codepane__example');

        for (let example of allExamples) {
            this._initHighlightForExample(example);
        }
    }

    _initHighlightForExample (example) {
        const htmlSnippet = example.querySelector('.codepane__html');
        const cssSnippet = example.querySelector('.codepane__css');
        hljs.highlightBlock(htmlSnippet);
        hljs.highlightBlock(cssSnippet);
    }

    get el () {
        return this._el;
    }
}

export default CodePane;
