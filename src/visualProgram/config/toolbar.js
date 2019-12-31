var toolbar = toolbar || {};

toolbar = {
    groups: {
        'undo-redo': { index: 1 },
        'clear': { index: 2 },
        'fullscreen': { index: 3 },
        'zoom': { index: 6 },
        // 'grid': { index: 7 },
        'print': {index: 7}
    },
    tools: [
        {
            type: 'undo',
            name: 'undo',
            group: 'undo-redo',
            attrs: {
                button: {
                    'data-tooltip': 'Undo',
                    'data-tooltip-position': 'top',
                    'data-tooltip-position-selector': '.toolbar-container'
                }
            }
        },
        {
            type: 'redo',
            name: 'redo',
            group: 'undo-redo',
            attrs: {
                button: {
                    'data-tooltip': 'Redo',
                    'data-tooltip-position': 'top',
                    'data-tooltip-position-selector': '.toolbar-container'
                }
            }
        },
        {
            type: 'button',
            name: 'clear',
            group: 'clear',
            attrs: {
                button: {
                    id: 'btn-clear',
                    'data-tooltip': 'Clear Paper',
                    'data-tooltip-position': 'top',
                    'data-tooltip-position-selector': '.toolbar-container'
                }
            }
        },
        {
            type: 'zoom-to-fit',
            name: 'zoom-to-fit',
            group: 'zoom',
            attrs: {
                button: {
                    'data-tooltip': 'Zoom To Fit',
                    'data-tooltip-position': 'top',
                    'data-tooltip-position-selector': '.toolbar-container'
                }
            }
        },
        {
            type: 'zoom-out',
            name: 'zoom-out',
            group: 'zoom',
            attrs: {
                button: {
                    'data-tooltip': 'Zoom Out',
                    'data-tooltip-position': 'top',
                    'data-tooltip-position-selector': '.toolbar-container'
                }
            }
        },
        {
            type: 'label',
            name: 'zoom-slider-label',
            group: 'zoom',
            text: 'Zoom:'
        },
        {
            type: 'zoom-slider',
            name: 'zoom-slider',
            group: 'zoom'
        },
        {
            type: 'zoom-in',
            name: 'zoom-in',
            group: 'zoom',
            attrs: {
                button: {
                    'data-tooltip': 'Zoom In',
                    'data-tooltip-position': 'top',
                    'data-tooltip-position-selector': '.toolbar-container'
                }
            }
        },
        // {
        //     type: 'separator',
        //     group: 'grid'
        // },
        // {
        //     type: 'label',
        //     name: 'grid-size-label',
        //     group: 'grid',
        //     text: 'Grid size:',
        //     attrs: {
        //         label: {
        //             'data-tooltip': 'Change Grid Size',
        //             'data-tooltip-position': 'top',
        //             'data-tooltip-position-selector': '.toolbar-container'
        //         }
        //     }
        // },
        // {
        //     type: 'range',
        //     name: 'grid-size',
        //     group: 'grid',
        //     text: 'Grid size:',
        //     min: 1,
        //     max: 50,
        //     step: 1,
        //     value: 10
        // },
        {
            type: 'fullscreen',
            name: 'fullscreen',
            group: 'fullscreen',
            attrs: {
                button: {
                    'data-tooltip': 'Toggle Fullscreen Mode',
                    'data-tooltip-position': 'top',
                    'data-tooltip-position-selector': '.toolbar-container'
                }
            }
        }
        // {
        //     type: 'button',
        //     name: 'print',
        //     group: 'print',
        //     attrs: {
        //         button: {
        //             id: 'btn-print',
        //             'data-tooltip': 'Export code',
        //             'data-tooltip-position': 'top',
        //             'data-tooltip-position-selector': '.toolbar-container'
        //         }
        //     }
        // }
    ]
};

export {toolbar};
