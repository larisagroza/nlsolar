var url = 'http://solar.websitetesting.ro';

jQuery(function ($) {
    populateLegend();

    var idx = 0,
        mainContainer = $("#sketch"),
        mcWidth = mainContainer.width(),
        mcHeight = mainContainer.height(),
        minLeft = 99999,
        minTop = 99999,
        maxLeft = 0,
        maxTop = 0;

    $('.options').on('click', '.solar-panel', function () {
        //on click add the clone to the main container

        var _this = $(this),
            qty = (_this.data('qty') !== undefined) ? _this.data('qty') : 1;

        var tmpLeft = 0;
        for (var i = 0; i < qty; i++) {
            var clone = _this.clone();
            clone.attr('id', 'clone' + idx)
                .removeAttr('data-qty')
                .addClass('dropped')
                .css({'left': tmpLeft, 'top': 0, 'position': 'absolute'})
                .appendTo('#sketch');
            idx++;
            if (_this.hasClass('landscape')) {
                tmpLeft += 80;
            } else {
                tmpLeft += 50;
            }

            var deltaX = 0, deltaY = 0,
                deltaMaxX = 0, deltaMaxY = 0;

            clone.draggable({
                containment: 'parent',
                grid: [10, 10],
                multiple: {
                    beforeDrag: function (event, ui) {
                        //detect collisions
                        if (ui.position.left < deltaX) {
                            ui.position.left = deltaX;
                        }
                        if (ui.position.top < deltaY) {
                            ui.position.top = deltaY;
                        }

                        if (ui.position.left + deltaMaxX > mcWidth) {
                            ui.position.left = mcWidth - deltaMaxX;
                        }

                        if (ui.position.top + deltaMaxY > mcHeight) {
                            ui.position.top = mcHeight - deltaMaxY;
                        }
                    }
                },
                start: function (event, ui) {
                    //offsets when dragging multiple
                    deltaX = ui.position.left - minLeft;
                    deltaY = ui.position.top - minTop;
                    deltaMaxX = maxLeft - ui.position.left;
                    deltaMaxY = maxTop - ui.position.top;
                    removeLines();
                },
                stop: function () {
                    recalculatePositions();
                    recalculateWidths();
                }
            });
        }
        recalculateWidths();
    });

    mainContainer.on('click', '.dropped', function () {
        $(this).toggleClass('ui-selected');
    }).selectable({
        filter: '.draggable',
        stop: function () {
            recalculatePositions();
        }
    });


    $('.panel-options').click(function () {
        //sweetalert
        if ($('.ui-selected').length > 0) {
            swal({
                title: "Element Options",
                text: "Enter a number between 1-99 and then press OK.",
                content: {
                    element: "input",
                    attributes: {
                        placeholder: "0-99",
                        type: "text",
                    }
                },
                buttons: {
                    cancel: {
                        text: "Cancel",
                        value: null,
                        visible: true,
                        className: "",
                        closeModal: true,
                    },
                    confirm: {
                        text: "OK",
                        value: true,
                        visible: true,
                        className: "",
                        closeModal: true
                    }
                }
            })
                .then((value) => {
                    if (Math.floor(value) == value && $.isNumeric(value) && value > 0 && value < 100) {
                        //here should be called the ajax that stores
                        var selected = $('.ui-selected');
                        selected.attr('data-option', `${value}`)
                            .find('p:first-child')
                            .append('<p class="option"><span>' + `${value}` + '</span></p>');
                    } else if (value == '') {
                        $('.ui-selected .option').remove();
                    } else {
                        alertError('The value must be and integer between 1 and 99')
                    }
                });
        } else {
            alertError('You must select at least one panel')
        }
    });

    $('.panel-delete').click(function () {
        if ($('.ui-selected').length > 0) {
            swal({
                title: "Delete selected panels",
                dangerMode: true,
                buttons: {
                    cancel: {
                        text: "Cancel",
                        value: null,
                        visible: true,
                        className: "",
                        closeModal: true,
                    },
                    confirm: {
                        text: "OK",
                        value: true,
                        visible: true,
                        className: "",
                        closeModal: true
                    }
                }
            })
                .then((value) => {
                    if (value == true) {
                        $('.ui-selected').remove();
                        recalculateWidths();
                        //here should be called the ajax that refreshes the panels stored
                    }
                });
        } else {
            alertError('You must select at least one panel')
        }
    });

    $('.panel-deselect').click(function () {
        $('.ui-selected').removeClass('ui-selected');
    });

    $('.show-measurement').change(function () {
        recalculateWidths();
    });

    //calculate the bounding rectangle positions when moving multiples
    function recalculatePositions() {
        minLeft = 99999;
        minTop = 99999;
        maxLeft = 0;
        maxTop = 0;

        $('.ui-selected').each(function (e) {
            var c = $(this),
                x1 = c.position().left,
                x2 = x1 + c.width(),
                y1 = c.position().top,
                y2 = y1 + c.height();

            if (x1 < minLeft) {
                minLeft = x1;
            }

            if (x2 > maxLeft) {
                maxLeft = x2;
            }

            if (y1 < minTop) {
                minTop = y1;
            }

            if (y2 > maxTop) {
                maxTop = y2;
            }
        });
    }

    function alertError(titleText) {
        swal({
            title: titleText,
            dangerMode: true,
            button: {
                text: "OK",
                closeModal: true
            }
        })
    }

    function populateLegend() {
        $.getJSON(url + "/legend.json", function (jsonData) {
            var json = groupByKey(jsonData, 'type');
            if (json != 'undefined') {
                for (var type in json) {
                    if (type) {
                        var html = '',
                            legendItems = groupByKey(json[type], 'category');
                        for (var key in legendItems) {
                            html += '<h2>' + key + '</h2>';
                            for (var i = 0; i < legendItems[key].length; i++) {
                                var cssClasses = legendItems[key][i].identifier + ' ' + legendItems[key][i].css_class + ' ' + legendItems[key][i].type,
                                    qty = (typeof legendItems[key][i].qty !== 'undefined') ? legendItems[key][i].qty : 1,
                                    name = legendItems[key][i].name,
                                    width = legendItems[key][i].width,
                                    height = legendItems[key][i].height,
                                    img = (typeof legendItems[key][i].image !== 'undefined') ? legendItems[key][i].image : '',
                                    handleX = parseFloat(legendItems[key][i].handle_left) + parseFloat(legendItems[key][i].handle_right),
                                    handleY = parseFloat(legendItems[key][i].handle_top) + parseFloat(legendItems[key][i].handle_bottom);
                                    handleEndClampX = parseFloat(legendItems[key][i].endclamp_width);

                                html += '<div class="draggable solar-panel ' + cssClasses + '" data-qty="' + qty + '" ' +
                                    'style="background:url(' + img + ')" data-handle-x="' + handleX + '" data-handle-y="' + handleY + '" data-handle-end-clamp-x="' + handleEndClampX + '" data-type="' + legendItems[key][i].type + '" data-width="' + width + '" data-height="' + height + '">';
                                html += '<p>' + name + '</p>';
                                html += '<p class="small">' + width + 'x' + height + 'm</p>';
                                html += '</div>';
                            }
                            html += '<div class="clearfix"></div>';
                        }
                        $('.tools .options.' + type).html(html);
                    }
                }
            }
        });


    }

    function removeLines() {
        $('.sketch .line').remove();
    }

    function recalculateWidths() {
        removeLines();
        if ($('.form-check-input:checked').length == 0) {
            return;
        }
        var panels = [];
        $('.sketch .solar-panel').each(function () {
            var _this = $(this);
            if (!_this.hasClass('obstacle')) {
                var panel = {
                    left: _this.position().left,
                    top: _this.position().top,
                    width: _this.width(),
                    height: _this.height(),
                    handleWidth: _this.data('width'),
                    handleHeight: _this.data('height'),
                    handleX: _this.data('handle-x'),
                    handleY: _this.data('handle-y'),
                    handleEndClampX: _this.data('handle-end-clamp-x'),
                };
                panels.push(panel);
            }
        });
        panels.sort(getSortOrder('top'));

        var initialTop = null;
        for (var key in panels) {
            if (panels[key].top != initialTop) {
                initialTop = panels[key].top;

                var currentPanels = getPanelsByTop(panels, initialTop);
                currentPanels.sort(getSortOrder('left'));
                var panelWidth = 0;
                var panelHeight = 0;

                var handleWidth = currentPanels[0].handleEndClampX;
                var nextLeft = currentPanels[0].left;
                var startLeft = currentPanels[0].left;

                var lineWidth = 0;
                var lineHeight = 0;

                for (var k in currentPanels) {
                    var idx = parseInt(k) + 1;

                    if (nextLeft == currentPanels[k].left) {
                        panelWidth += currentPanels[k].handleWidth;
                        handleWidth += currentPanels[k].handleX;
                        nextLeft = currentPanels[k].left + currentPanels[k].width;
                        lineWidth += currentPanels[k].width;
                        if (panelHeight < currentPanels[k].handleHeight + currentPanels[k].handleX) {
                            panelHeight = currentPanels[k].handleHeight + currentPanels[k].handleX;
                            lineHeight = currentPanels[k].height;
                        }
                    } else {
                        startLeft = currentPanels[k - 1].left + currentPanels[k - 1].width - lineWidth;
                        handleWidth += currentPanels[k - 1].handleEndClampX;
                        drawWidthLine(startLeft, initialTop, lineWidth, panelWidth, handleWidth, panelHeight, lineHeight);
                        panelWidth = 0;
                        handleWidth = 0;
                        lineWidth = 0;
                        if (idx < currentPanels.length) {
                            nextLeft = currentPanels[k].left + currentPanels[k].width;
                        } else {
                            nextLeft = 0;
                        }
                        panelWidth += currentPanels[k].handleWidth;
                        handleWidth += currentPanels[k].handleX + currentPanels[k].handleEndClampX;
                        lineWidth += currentPanels[k].width;
                        if (panelHeight < currentPanels[k].handleHeight + currentPanels[k].handleX) {
                            panelHeight = currentPanels[k].handleHeight + currentPanels[k].handleX;
                            lineHeight = currentPanels[k].height;
                        }
                    }

                    if (idx == currentPanels.length) {
                        handleWidth += currentPanels[k].handleEndClampX;
                        startLeft = currentPanels[k].left + currentPanels[k].width - lineWidth;
                    }
                }
                drawWidthLine(startLeft, initialTop, lineWidth, panelWidth, handleWidth, panelHeight, lineHeight);
            }
        }

    }

    function drawWidthLine(left, top, lineWidth, panelWidth, handleWidth, panelHeight, lineHeight) {
        var padding = 10,
            verticalLeft = left + padding/2,
            verticalTop = top + padding/2,
            horizontalTop = top + padding / 2,
            horizontalLeft = left + padding;


        lineWidth -= 2 * padding;
        var metersWidth = panelWidth * 1.0 + handleWidth * 1.0;

        var line = '<div class="line" style="top: ' + horizontalTop + 'px; left: ' + horizontalLeft + 'px; width: ' + lineWidth + 'px;">';
        line += metersWidth.toFixed(2) + 'm';
        line += '</div>';
        $('.sketch').append(line);

        // lineHeight -= 2 * padding;
        // var line = '<div class="line vertical" style="top: ' + verticalTop + 'px; left: ' + verticalLeft + 'px; height: ' + lineHeight + 'px; width: 8px;">';
        // line += '<span style="position: absolute; transform: rotate(-90deg);">' + panelHeight.toFixed(2) + 'm' + '</span>';
        // line += '</div>';
        // $('.sketch').append(line);
    }

    function getPanelsByTop(data, top) {
        return data.filter(
            function (data) {
                return data.top == top
            }
        );
    }


    function getSortOrder(prop) {
        return function (a, b) {
            if (a[prop] > b[prop]) {
                return 1;
            } else if (a[prop] < b[prop]) {
                return -1;
            }
            return 0;
        }
    }

    function groupByKey(xs, key) {
        return xs.reduce(function (rv, x) {
            (rv[x[key]] = rv[x[key]] || []).push(x);
            return rv;
        }, {});
    };
});