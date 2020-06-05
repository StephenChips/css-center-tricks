import '../assets/index.css';
import '../assets/examples.css'
import CodePane from './CodePane';
import Menu from './Menu';

const defaultColorSettings = {
    'color': 'white',
    'background-color': '#00aaff'
};

const navMenuDataForPage = {
    'horizontal': [
        { key: 'h-flexbox', data: 'flexbox' },
        { key: 'h-auto-margin', data: 'auto margin' },
        { key: 'h-position-absolute', data: 'position absolute' },
        { key: 'h-text-align', data: 'text-align' }
    ]
};

let $sidemenu, $navmenu, $btnShowCode, $btnShowResult, $codePane;

initElements();
initEventsForElements();
addExamplesToCodePane();
setPage('horizontal');

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
    $navmenu.setActivedItem();
    $navmenu.setItems(navMenuDataForPage[key]);
}

function addExamplesToCodePane () {
    $codePane.addExample('h-flexbox', {
        html: `<div class="wrapper">
            <div class="centered">I'm horizontal centered!</div>
        </div>`,
    
        css: {
            '.wrapper': {
                'display': 'flex',
                'justify-content': 'center'
            }
        }
    });
    
    $codePane.addExample('h-auto-margin', {
        html: `<div class="wrapper">
            <div class="centered">I'm horizontal centered!</div>
        </div>`,
    
        css: {
            '.wrapper': {
                'display': 'block',
            },
    
            '.centered': {
                ...defaultColorSettings,
                'display': 'block',
                'width': '200px',
                'margin': '0 auto'
            }
        }
    });
    
    $codePane.addExample('h-position-absolute', {
        html: `<div class="wrapper">
            <div class="centered">I'm horizontal centered!</div>
        </div>`,
    
        css: {
            '.wrapper': {
                'display': 'block',
                'position':　'relative'
            },
    
            '.centered': {
                ...defaultColorSettings,
                'position': 'absolute',
                'width': '200px',
                'left': '0',
                'right': '0',
                'margin': '0 auto'
            }
        }
    });
    
    $codePane.addExample('h-text-align', {
        html: `<div class="wrapper">
            <div class="centered">I'm horizontal centered!</div>
        </div>`,
    
        css: {
            '.wrapper': {
                'display': 'block',
                'text-align': 'center'
            },
    
            '.centered': {
                'display': 'inline-block'
            }
        }
    });
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
            $navmenu.setItems(navMenuDataForPage['horizontal']);
        } else if (key === 'vertical') {
            $navmenu.setItems(navMenuDataForPage['vertical']);
        } else if (key === 'horizontal-vertical') {
            $navmenu.setItems(navMenuDataForPage['horizontal-vertical']);
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
