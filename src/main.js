import 'regenerator-runtime/runtime';

import '../assets/index.css';
import '../assets/examples.css'
import CodePane from './CodePane';
import Menu from './Menu';

import 'prismjs/themes/prism.css';

const navMenuDataForPage = {
    'horizontal': [
        { key: 'h-flexbox', data: 'flexbox' },
        { key: 'h-auto-margin', data: 'auto margin' },
        { key: 'h-position-absolute', data: 'position absolute' },
        { key: 'h-text-align', data: 'text-align' }
    ],
    'vertical': [
        { key: 'v-flexbox', data: 'flexbox' },
        { key: 'v-position-absolute', data: 'position absolute' },
        { key: 'v-vertical-align', data: 'vertical align' }
    ],
    'horizontal-vertical': [
        { key: 'hv-flexbox', data: 'flexbox' },
        { key: 'hv-position-absolute', data: 'position absolute' }
    ]
};

let $sidemenu, $navmenu, $btnShowCode, $btnShowResult, $codePane;

(async () => {
    initElements();
    initEventsForElements();
    await addExamplesToCodePane();
    setPage('horizontal');
    console.log('App has loaded!');
})();

async function addExamplesToCodePane () {
    let request = await fetch('/api/css-center-tricks/examples');
    let examples = await request.json();

    for (let example of examples) {
        $codePane.addExample(example.key, {
            html: example.html,
            css: example.css,
            htmlSnippet: example.htmlSnippet,
            cssSnippet: example.cssSnippet
        });
    }
}

function initElements () {
    $sidemenu = new Menu(document.getElementById('sidemenu'), {
        rootClass: 'sidemenu',
        itemClass: 'sidemenu__item',
        activedClass: 'active',
        createMenuItemElement ({ data }) {
            return `<li><a href="javascript:void(0);">${data}</a></li>`;
        }
    });

    $navmenu = new Menu(document.getElementById('navmenu'), {
        rootClass: 'navmenu',
        itemClass: 'navmenu__item',
        activedClass: 'active',
        createMenuItemElement ({ data }) {
            return `<a class="nav-item nav-link" href="#">${data}</a>`;
        }
    });

    $btnShowCode = document.getElementById('btn-show-code');

    $btnShowResult = document.getElementById('btn-show-result');

    $codePane = new CodePane(document.getElementById('codepane'));
}

function setPage (key) {
    $sidemenu.setActivedItem(key, false);
    $navmenu.setItems(navMenuDataForPage[key]);
    const navMenuData = navMenuDataForPage[key];
    $navmenu.setActivedItem(navMenuData[0].key);
    $codePane.showExample(navMenuData[0].key);
}

function initEventsForElements () {
    $btnShowCode.addEventListener('click', () => {
        $codePane.showCode();
    });
    
    $btnShowResult.addEventListener('click', () => {
        $codePane.showResult();
    });
    
    $sidemenu.on('active', ({ key }) => {
        if (key === 'horizontal') {
            setPage('horizontal');
        } else if (key === 'vertical') {
            setPage('vertical');
        } else if (key === 'horizontal-vertical') {
            setPage('horizontal-vertical');
        } else if (key === 'mindmap') {
            console.log('This page is under construction');
        } else {
            console.error('No such key');
        }
    });

    $navmenu.on('active', (event) => {
        $codePane.showExample(event.key);
    });
}
