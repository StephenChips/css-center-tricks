import '../assets/index.css';
import '../assets/examples.css'
import CodePane from './CodePane';
import Menu from './Menu';

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
        { key: 'v-vertical-align', data: 'vertical-align' }
    ],
    'horizontal-vertical': [
        { key: 'h&v-flexbox', data: 'flexbox' },
        { key: 'h&v-position-absolute', data: 'vertical-align' }
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
    $sidemenu.setActivedItem(key, false);
    $navmenu.setItems(navMenuDataForPage[key]);
    const keyOfActivedExample = navMenuDataForPage[key][0].key;
    $navmenu.setActivedItem(keyOfActivedExample);
    $codePane.showExample(keyOfActivedExample);
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
                'text-align': 'center',
            },
    
            '.centered': {
                'display': 'inline-block'
            }
        }
    });

    $codePane.addExample('v-flexbox', {
        html: `<div class="wrapper">
            <div class="centered">I'm vertical centered!</div>
        </div>`,
    
        css: {
            '.wrapper': {
                'display': 'flex',
                'align-items': 'center',
                'height': '100%'
            }
        }
    });

    $codePane.addExample('v-position-absolute', {
        html: `<div class="wrapper">
            <div class="centered">I'm vertical centered!</div>
        </div>`,

        css: {
            '.wrapper': {
                'position': 'relative',
                'height': '100%'
            },
            '.centered': {
                'position': 'absolute',
                'height': '200px',
                'top': '0',
                'bottom': '0',
                'margin-top': 'auto',
                'margin-bottom': 'auto'
            }
        }
    });

    $codePane.addExample('v-vertical-align', {
        html: `<div class="wrapper">
            <div class="centered">I'm vertical centered!</div>
        </div>`,

        css: {
            '.wrapper': {
                'height': '100%',
            },
            '.wrapper::after': {
                'display': 'inline-block',
                'content': '\'\'',
                'width': '0',
                'height': '100%',
                'vertical-align': 'middle'
            },
            '.centered': {
                'display': 'inline-block',
            }
        }
    });

    $codePane.addExample('h&v-flexbox', {
        html: `<div class="wrapper">
            <div class="centered">I'm vertical centered!</div>
        </div>`,

        css: {
            '.wrapper': {
                'height': '100%',
                'display': 'flex',
                'justify-content': 'center',
                'align-items': 'center'
            }
        }
    });

    $codePane.addExample('h&v-position-absolute', {
        html: `<div class="wrapper">
            <div class="centered">I'm vertical centered!</div>
        </div>`,

        
        css: {
            '.wrapper': {
                'height': '100%',
                'position': 'relative'
            },
            '.centered': {
                'position': 'absolute',
                'top': '0',
                'bottom': '0',
                'left': '0',
                'right': '0',
                'height':'200px',
                'width': '200px',
                'margin': 'auto'
            }
        }
    })
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
