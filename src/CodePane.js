import '../assets/CodePane.css';
import split from 'split.js';

// This is the key that we set on a style tag. It is used to identify
// the example which it relates to. 
const STYLE_EXAMPLE_KEYNAME = 'data-codepane-example-key';

// This is the key that we set on an example's element. It is the
// unique ID of the example in a CodePane.
const EXAMPLE_KEYNAME = 'data-key';

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
            let keyOfFirstExample = firstChild.getAttribute(EXAMPLE_KEYNAME);

            // Initialize split.js for all examples.
            this._initSplitViewForAllExamples();

            // Calling the "showExample(...)" will ends the "creating" state.
            this.showExample(keyOfFirstExample);
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
        this._currentExampleKey = newActivedExample.getAttribute(EXAMPLE_KEYNAME);

        const exampleState = this._getExampleState(newActivedExample);
        if (exampleState === 'showing-code' && this._state === 'showing-result') {
            this.showResult();
        } else if (exampleState === 'showing-result' && this._state === 'showing-code') {
            this.showCode();
        }
    }

    showCode () {
        if (this._el.children.length > 0) {
            // this._currentExampleKey points to the example that is currently being shown.
            // And because of that, it will not be null or undefined, except there are no
            // examples in the CodePane. In that situation, it must be null.
            let example = this._findExampleByKey(this._currentExampleKey);
            let code = example.querySelector('.codepane__code');
            let result = example.querySelector('.codepane__result');
    
            result.classList.remove('actived');
            code.classList.add('actived');
        }

        this._state = 'showing-code';
    }

    showResult () {
        if (this._el.children.length > 0) {
            // this._currentExampleKey points to the example that is currently being shown.
            // And because of that, it will not be null or undefined, except there are no
            // examples in the CodePane. In that situation, it must be null.
            let example = this._findExampleByKey(this._currentExampleKey);
            let code = example.querySelector('.codepane__code');
            let result = example.querySelector('.codepane__result');
    
            result.classList.add('actived');
            code.classList.remove('actived');    
        }

        this._state = 'showing-result';
    }

    /**
     * Add an example to a codepane.
     * @param {string} key example's key
     * @param {{ html: string, css: string, htmlSnippet: string, cssSnippet: string }}} param1 object specifies an example's content
     */
    addExample (key, { html, css, htmlSnippet, cssSnippet }) {
        if (this._findExampleByKey(key) !== null) {
            throw new Error('Your example\'s key is same with an existed example.');
        }

        // Firstm we create DOM structure through arguments.
        const $example = this._parseHTML(
`<div class="codepane__example" data-key="${key}">
    <div class="codepane__code">
        <div class="codepane__html">
            <pre><code>${htmlSnippet}</code></pre>
        </div>
        <div class="codepane__css">
            <pre><code>${cssSnippet}</code></pre>
        </div>
    </div>
    <div class="codepane__result">
        ${html}
    </div>
</div>`
        );

        // Then, we initialize the CodePane's states. The code snippets is show first by default.
        const $result = $example.querySelector('.codepane__result');
        const $code = $example.querySelector('.codepane__code');
        if (this._state === 'showing-code') {
            $code.classList.add('actived');
        } else if (this._state === 'showing-result') {
            $result.classList.add('actived');
        }

        // Then, we insert <style> tag with scoped style rules to the <head> element.
        const styleTag = document.createElement('style');
        styleTag.setAttribute(STYLE_EXAMPLE_KEYNAME, key);
        styleTag.textContent = this._addScopeToCssRules(css);
        
        this._el.appendChild($example);
        document.head.appendChild(styleTag);

        // Finally, initalize split.js for this new example.
        this._initSplitViewForExample($example);
    }

    _getExampleState (example) {
        var elCode = example.querySelector('.codepane__code');
        if (elCode.classList.contains('actived')) {
            return 'showing-code';
        } else {
            return 'showing-result';
        }
    }

    _addScopeToCssRules (css) {
        return css;
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

    get el () {
        return this._el;
    }
}

export default CodePane;
