import '../assets/index.css';
import '../assets/examples.css'
import CodePane from './CodePane';

import Menu from './Menu';

const $sidemenu = new Menu(document.getElementById('sidemenu'), {
    rootClass: 'sidemenu',
    itemClass: 'sidemenu__item',
    activedClass: 'active',
    createMenuItemElement ({ data }) {
        return `<li><a href="javascript:void(0);">${data}</a></li>`;
    }
});

const $navmenu = new Menu(document.getElementById('navmenu'), {
    rootClass: 'navmenu',
    itemClass: 'navmenu__item',
    activedClass: 'active',
    createMenuItemElement ({ data }) {
        return `<a class="nav-item nav-link" href="#">${data}</a>`;
    }
});

const $btnShowCode = document.getElementById('btn-show-code');

const $btnShowResult = document.getElementById('btn-show-result');

const $codePane = new CodePane(document.getElementById('codepane'));

var navMenuData = {
    'horizontal': [
        { key: 'hc-auto-margin', data: 'auto margin' },
        { key: 'hc-position-absolute', data: 'absolute position' },
        { key: 'hc-text-align', data: 'text align' },
        { key: 'hc-flexbox', data: 'flexbox' }
    ],
    'vertical': [
        { key: 'absolute-poistion', data: 'absolute position' },
        { key: 'table-trick', data: 'table trick' },
        { key: 'inline-trick', data: 'inline-trick' },
        { key: 'flexbox', data: 'flexbox' }
    ],
    'horizontal-vertical': [
        { key: 'absolute-poistion', data: 'absolute position' },
        { key: 'table-trick', data: 'table trick' },
        { key: 'inline-trick', data: 'inline-trick' },
        { key: 'flexbox', data: 'flexbox' }
    ]
};

$btnShowCode.addEventListener('click', () => {
    $codePane.showCode();
});

$btnShowResult.addEventListener('click', () => {
    $codePane.showResult();
});

// $sidemenu.on('active', ({ key }) => {
//     if (key === 'horizontal') {
//         $navmenu.setItems(navMenuData['horizontal']);
//     } else if (key === 'vertical') {
//         $navmenu.setItems(navMenuData['vertical']);
//     } else if (key === 'horizontal-vertical') {
//         $navmenu.setItems(navMenuData['horizontal-vertical']);
//     } else if (key === 'mindmap') {
//         console.log('This page is under construction');
//     } else {
//         console.error('No such key');
//     }
// });

$navmenu.setItems(navMenuData['horizontal']);
$navmenu.on('active', (event) => {
    console.log(event)
    $codePane.showExample(event.key);
});
