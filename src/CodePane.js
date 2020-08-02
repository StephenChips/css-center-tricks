import '../assets/CodePane.css';
import split from 'split.js';
import addScopeToCSSRules from './addScopeToCSSRules/index.ts';

// This is the key that we set on a style tag. It identifies
// which example it relates to. 
const STYLE_EXAMPLE_KEYNAME = 'data-codepane-example-key';

class CodePane {
    /**
     * 
     * @param {Element} root HTML Element of CodePane
     */
    constructor (root) {
        // There are two states for a CodePane, which are the 'showing-code' state and the 'showing-result' state.
        // When it's showing the current example's HTML & CSS snippets,  it's in the 'showing-code' state.
        // When it's showing the current example's result HTML, it's in the 'showing-result' state.
        this._state = 'showing-code';
        this._root = root;
        this._currentExampleKey = null;

        this._cleanUpRoot();
    }

    showExample (key) {
        let perfixed = this._perfixedKey(key);
        if (perfixed === this._currentExampleKey) {
            return;
        }

        this._showExample(perfixed);
    }

    showCode () {
        if (this._root.childNodes.length > 0) {
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
        if (this._root.childNodes.length > 0) {
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
        if (this._findExampleByKey(this._perfixedKey(key)) !== null) {
            throw new Error('Your example\'s key is same with an existed example.');
        }

        const perfixedKey = this._perfixedKey(key);

        // Firstm we create DOM structure through arguments.
        const $example = this._parseHTML(
`<div class="codepane__example" data-${perfixedKey}>
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

        // Then, we insert <style> tag with scoped style rules to the <head> element.
        const styleTag = document.createElement('style');
        styleTag.setAttribute(STYLE_EXAMPLE_KEYNAME, key);
        styleTag.textContent = addScopeToCSSRules(perfixedKey, css)
        
        this._root.appendChild($example);
        document.head.appendChild(styleTag);

        
        

        // Finally, initalize split.js for this new example.
        this._initSplitViewForExample($example);

        if (this._root.childNodes.length === 1) {
            this._showExample(perfixedKey);
        }
    }

    _showExample (perfixedKey) {
        let newActivedExample = this._findExampleByKey(perfixedKey);
        if (newActivedExample === null) {
            throw new Error('The pane does not exists');
        }

        // If the codepane is empty, `this._currentExampleKey` will be null.
        if (this._currentExampleKey !== null) {
            let oldActivedExample = this._findExampleByKey(this._currentExampleKey);
            oldActivedExample.classList.remove('actived');
        }

        newActivedExample.classList.add('actived');
        this._currentExampleKey = perfixedKey;

        
        if (this._state === 'showing-result') {
            this.showResult();
        } else if (this._state === 'showing-code') {
            this.showCode();
        }
    }

    _cleanUpRoot () {
        while (this._root.childNodes.length > 0) {
            this._root.removeChild(this._root.firstChild);
        }
    }

    _getExampleState (example) {
        var elCode = example.querySelector('.codepane__code');
        if (elCode.classList.contains('actived')) {
            return 'showing-code';
        } else {
            return 'showing-result';
        }
    }

    _perfixedKey (key) {
        return `codepane-example-${key.replace(/[A-Z]/g, match => '-' + match.toLowerCase())}`
    }

    _parseHTML (str) {
        let wrapper = document.createElement('div');
        wrapper.innerHTML = str;
        return wrapper.firstElementChild;
    }

    _findExampleByKey (perfixedKey) {
        return this._root.querySelector(`[data-${perfixedKey}]`);
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

    get el () {
        return this._root;
    }
}

export default CodePane;
