jQuery(function ($) {
    var idx = 0,
        mainContainer = $("#sketch"),
        mcWidth = mainContainer.width(),
        mcHeight = mainContainer.height(),
        minLeft = 99999,
        minTop = 99999,
        maxLeft = 0,
        maxTop = 0;

    $('.solar-panel').click(function () {
        //on click add the clone to the main container
        var clone = $(this).clone();
        clone.attr('id', 'clone' + idx)
            .addClass('dropped')
            .css({'left': 0, 'top': 0, 'position': 'absolute'})
            .appendTo('#sketch');

        idx++;

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
            },
            stop: function () {
                recalculatePositions();
            }
        });
    });

    mainContainer.on('click', '.dropped', function () {
        $(this).toggleClass('ui-selected');
    }).selectable({
        stop: function () {
            recalculatePositions();
        }
    });


    $('.panel-options').click(function(){
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
                $('.ui-selected').attr('data-option', `${value}`);
                //here should be called the ajax that stores
            });
        } else {
            alertNoSelection();
        }
    });

    $('.panel-delete').click(function(){
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
                    //here should be called the ajax that refreshes the panels stored
                }
            });
        } else {
            alertNoSelection()
        }
    });

    $('.panel-deselect').click(function(){
       $('.ui-selected').removeClass('ui-selected');
    });

    //calculate the bounding rectangle positions when moving multiples
    function recalculatePositions()
    {
        minLeft = 99999;
        minTop = 99999;
        maxLeft = 0;
        maxTop = 0;

        $('.ui-selected').each(function () {
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

    function alertNoSelection()
    {
        swal({
            title: 'You must select at least one panel',
            dangerMode: true,
            button: {
                text: "OK",
                closeModal: true
            }
        })
    }
});