var url = 'http://solar.websitetesting.ro';
var panelsHeight = [];

Array.prototype.getSet = function (set) {
    return this.filter(function (item) {
        return item.visited == set;
    });
};
var Const = {};

jQuery(function ($) {
    populateLegend();

    var idx = 0,
        mainContainer = $("#sketch"),
        mcWidth = mainContainer.width(),
        mcHeight = mainContainer.height(),
        minLeft = 99999,
        minTop = 99999,
        maxLeft = 0,
        maxTop = 0,
        widthLines = [];

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

            if (clone.hasClass('obstacle')) {
                var ratioX = clone.data('width') / clone.width(),
                    ratioY = clone.data('height') / clone.height();

                clone.attr('data-ratio-x', ratioX)
                    .attr('data-ratio-y', ratioY);
            }
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
                    recalculateHeights()
                }
            });

            if (clone.hasClass('obstacle') && clone.data('resizable') == true) {
                clone.resizable({
                    grid: [10, 10],
                    minHeight: 50,
                    minWidth: 50,
                    stop: function (event, ui) {
                        var ratioX = ui.originalElement.data('ratio-x'),
                            ratioY = ui.originalElement.data('ratio-y'),
                            stopWidthMeters = ui.size.width * ratioX,
                            stopHeightMeters = ui.size.height * ratioY;

                        ui.element.attr('data-width', stopWidthMeters)
                            .attr('data-height', stopHeightMeters)
                            .find('.small').html(stopWidthMeters + 'x' + stopHeightMeters + 'm');
                    }
                });
            }
        }
        setTimeout(function () {
            recalculateWidths();
            recalculateHeights()
        }, 0);
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
        recalculateHeights();
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
                                    handleY = parseFloat(legendItems[key][i].handle_top) + parseFloat(legendItems[key][i].handle_bottom),
                                    handleEndClampX = parseFloat(legendItems[key][i].endclamp_width),
                                    resizable = legendItems[key][i].resizable;

                                html += '<div class="draggable solar-panel ' + cssClasses + '" data-qty="' + qty + '" ' +
                                    'style="background:url(' + img + ')" data-handle-x="' + handleX + '" data-handle-y="' + handleY + '" data-handle-end-clamp-x="' + handleEndClampX + '" data-type="' + legendItems[key][i].type + '" data-width="' + width + '" data-height="' + height + '" data-resizable="' + resizable + '">';
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
                    handleEndClampX: _this.data('handle-end-clamp-x')
                };
                panels.push(panel);
            }
        });
        panels.sort(getSortOrder('top'));

        var initialTop = null;
        widthLines = [];

        for (var key = 0; key < panels.length; key++) {
            if (panels[key].top != initialTop) {
                initialTop = panels[key].top;

                var currentPanels = getPanelsByTop(panels, initialTop);
                currentPanels.sort(getSortOrder('left'));
                var panelWidth = 0;


                var handleWidth = currentPanels[0].handleEndClampX;
                var nextLeft = currentPanels[0].left;
                var startLeft = currentPanels[0].left;

                var lineWidth = 0;

                for (var k = 0; k < currentPanels.length; k++) {
                    var idx = parseInt(k) + 1;

                    if (nextLeft == currentPanels[k].left) {
                        panelWidth += currentPanels[k].handleWidth;
                        handleWidth += currentPanels[k].handleX;
                        nextLeft = currentPanels[k].left + currentPanels[k].width;
                        lineWidth += currentPanels[k].width;
                    } else {
                        startLeft = currentPanels[k - 1].left + currentPanels[k - 1].width - lineWidth;
                        handleWidth += currentPanels[k - 1].handleEndClampX;
                        drawWidthLine(startLeft, initialTop, lineWidth, panelWidth, handleWidth);
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
                    }

                    if (idx == currentPanels.length) {
                        handleWidth += currentPanels[k].handleEndClampX;
                        startLeft = currentPanels[k].left + currentPanels[k].width - lineWidth;
                    }
                }
                drawWidthLine(startLeft, initialTop, lineWidth, panelWidth, handleWidth);
            }
        }

    }

    function recalculateHeights() {
        if ($('.form-check-input:checked').length == 0) {
            return;
        }

        panelsHeight = [];
        $('.sketch .solar-panel').each(function () {
            var _this = $(this);
            if (!_this.hasClass('obstacle')) {
                var panel = new Panel(
                    _this.attr('id'),
                    _this.position().left,
                    _this.position().top,
                    _this.width(),
                    _this.height(),
                    _this.data('width'),
                    _this.data('height'),
                    _this.data('handle-x'),
                    _this.data('handle-y'),
                    _this.data('handle-end-clamp-x')
                );
                panelsHeight.push(panel);
            }
        });

        //sort
        panelsHeight.sort(function (a, b) {
            if (a.top == b.top) {
                return a.left - b.left;
            }
            return a.top - b.top;
        });

        for (var key = 0, item; item = panelsHeight[key++];) {
            item.getNeighbours();
        }

        Const.SET = 1;

        do {
            var found = false;
            jQuery.each(panelsHeight, function (k, panel) {
                if (!panel.visited) {
                    found = panel;
                    return false;
                }
            });
            if (!found) {
                break;
            }

            found.visit();
            Const.SET++;
        } while (true);


        for (var i = 1; i < Const.SET; i++) {
            var phSet = panelsHeight.getSet(i);
            var phCost = phSet.map(function (panel) {
                panel.cost = 0;
                return panel.getCost();
            });

            var maxmax = Math.max.apply(Math, phCost);
            //draw line starting from first to last
            if (maxmax > 0) {
                var start = phSet[0],
                    end = phSet[phSet.length - 1],
                    startX = start.left - 10;
                drawHeightLine(startX, start.top, end.top + end.height - start.top, maxmax);
            }
        }

    }

    function drawWidthLine(left, top, lineWidth, panelWidth, handleWidth) {
        var padding = 10,
            horizontalTop = top + padding / 2,
            horizontalLeft = left + padding;


        lineWidth -= 2 * padding;
        var metersWidth = panelWidth * 1.0 + handleWidth * 1.0;

        var line = '<div class="line" style="top: ' + horizontalTop + 'px; left: ' + horizontalLeft + 'px; width: ' + lineWidth + 'px;">';
        line += metersWidth.toFixed(2) + 'm';
        line += '</div>';
        $('.sketch').append(line);
    }

    function drawHeightLine(startX, startY, lineHeight, meters) {
        var padding = 10,
            paddingTop = lineHeight * 1.0 / 2;

        lineHeight -= padding;
        startY += padding / 2;
        var line = '<div class="line vertical" style="top: ' + startY + 'px; left: ' + startX + 'px; height: ' + lineHeight + 'px; width: 8px; line-height: ' + lineHeight + 'px">';
        line += '<span style="margin-left: 10px; color: #000; background: yellow; border-radius: 3px; padding: 3px;">';
        line += meters.toFixed(2) + 'm';
        line += '</span>';
        line += '</div>';
        $('.sketch').append(line);
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

class Panel {
    constructor(id, left, top, width, height, handleWidth, handleHeight, handleX, handleY, handleEndClampX) {
        this.id = id;
        this.visited = 0;
        this.computed = 0;
        this.left = left;
        this.top = top;
        this.height = height;
        this.width = width;
        this.bottom = this.top + this.height;
        this.right = this.left + this.width;
        this.handleWidth = handleWidth;
        this.handleHeight = handleHeight;
        this.handleX = handleX;
        this.handleY = handleY;
        this.handleEndClampX = handleEndClampX;
    }

    getNeighbours() {
        var bottomPanels = [];
        var rightPanels = [];
        var leftPanels = [];
        var topPanels = [];
        for (var key = 0; key < panelsHeight.length; key++) {
            if (this.bottom == panelsHeight[key].top &&
                (this.left <= panelsHeight[key].left && panelsHeight[key].left <= this.right ||
                this.left <= panelsHeight[key].right && panelsHeight[key].right <= this.right)) {
                bottomPanels.push(panelsHeight[key]);
            }
            if (this.right == panelsHeight[key].left &&
                (this.top <= panelsHeight[key].top && panelsHeight[key].top <= this.bottom ||
                this.top <= panelsHeight[key].bottom && panelsHeight[key].bottom <= this.bottom)) {
                rightPanels.push(panelsHeight[key]);
            }

            if (this.left == panelsHeight[key].right &&
                (this.top <= panelsHeight[key].top && panelsHeight[key].top <= this.bottom ||
                this.top <= panelsHeight[key].bottom && panelsHeight[key].bottom <= this.bottom)) {
                leftPanels.push(panelsHeight[key]);
            }

            if (this.top == panelsHeight[key].bottom &&
                (this.left <= panelsHeight[key].left && panelsHeight[key].left <= this.right ||
                this.left <= panelsHeight[key].right && panelsHeight[key].right <= this.right)) {
                topPanels.push(panelsHeight[key]);
            }

        }
        this.bottomPanels = bottomPanels;
        this.rightPanels = rightPanels;
        this.leftPanels = leftPanels;
        this.topPanels = topPanels;
    }

    getCost() {
        var costs = [];

        if (!this.bottomPanels.length) {
            return this.handleHeight + this.handleY;
        }

        for (var i = 0, pb; pb = this.bottomPanels[i++];) {
            var current = pb;
            var pbSiblings = [pb];

            while (pb.rightPanels.length) {
                var nextValid = pb.rightPanels.filter(function (item) {
                    return item.bottom != pb.top && item.top != pb.bottom;
                });

                if (!nextValid.length) {
                    break;
                }

                pbSiblings = pbSiblings.concat(nextValid);
                pb = nextValid[0];
            }

            pb = current;
            while (pb.leftPanels.length) {
                var nextValid = pb.leftPanels.filter(function (item) {
                    return item.bottom != pb.top && item.top != pb.bottom;
                });

                if (!nextValid.length) {
                    break;
                }

                pbSiblings = pbSiblings.concat(nextValid);
                pb = nextValid[0];
            }
        }

        for (var key = 0; key < pbSiblings.length; key++) {
            if (pbSiblings[key] !== this) {
                costs.push(pbSiblings[key].getCost());
            }
        }

        if (costs.length) {
            return this.handleHeight + this.handleY + Math.max.apply(Math, costs);
        }

        return 0;
    }

    visit() {
        if (this.visited) {
            return;
        }

        this.visited = Const.SET;
        if (this.rightPanels.length) {
            for (var key = 0, item; item = this.rightPanels[key++];) {
                item.visit();
            }
        }

        if (this.bottomPanels.length) {
            for (var key = 0, item; item = this.bottomPanels[key++];) {
                item.visit();
            }
        }

        if (this.leftPanels.length) {
            for (var key = 0, item; item = this.leftPanels[key++];) {
                item.visit();
            }
        }
        if (this.topPanels.length) {
            for (var key = 0, item; item = this.topPanels[key++];) {
                item.visit();
            }
        }
    }

}