document.addEventListener('DOMContentLoaded', function() {
    var collapsibles = document.querySelectorAll('.collapsible');

    collapsibles.forEach(function(collapsible) {
        var title = collapsible.querySelector('.section-title');
        var content = collapsible.querySelector('.section-content');

        title.addEventListener('click', function() {
            title.classList.toggle('open');
            content.classList.toggle('closed');
        });
    });
});

