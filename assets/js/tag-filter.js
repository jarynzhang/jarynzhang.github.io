(function () {
  'use strict';

  var archive = document.querySelector('[data-post-archive]');
  if (!archive) return;

  var filters = archive.querySelector('[data-tag-filters]');
  var status = archive.querySelector('[data-tag-status]');
  if (!filters || !status) return;

  var controls = Array.prototype.slice.call(filters.querySelectorAll('[data-tag-filter]'));
  var years = Array.prototype.slice.call(archive.querySelectorAll('[data-archive-year]'));
  var entries = Array.prototype.map.call(archive.querySelectorAll('[data-archive-post]'), function (element) {
    var tags;
    try {
      tags = JSON.parse(element.getAttribute('data-tags') || '[]');
    } catch (error) {
      tags = [];
    }
    return {
      element: element,
      tags: Array.isArray(tags) ? tags.filter(function (tag) {
        return typeof tag === 'string' && tag.trim() !== '';
      }) : []
    };
  });

  // YAML 2024 and "2024" may be distinct site.tags keys but share one label.
  var seenTags = [];
  controls = controls.filter(function (control) {
    var tag = control.getAttribute('data-tag-filter');
    if (seenTags.indexOf(tag) !== -1) {
      control.parentElement.hidden = true;
      return false;
    }
    seenTags.push(tag);
    var badge = control.querySelector('[data-tag-count]');
    if (badge) {
      badge.textContent = entries.filter(function (entry) {
        return tag === '' || entry.tags.indexOf(tag) !== -1;
      }).length;
    }
    return true;
  });

  function selectedTag() {
    if (window.location.hash.indexOf('#tag=') !== 0) return '';
    var tag;
    try {
      // Liquid's url_encode uses + for spaces; encodeURIComponent uses %20.
      tag = decodeURIComponent(window.location.hash.slice(5).replace(/\+/g, ' '));
    } catch (error) {
      return '';
    }
    return controls.some(function (control) {
      return control.getAttribute('data-tag-filter') === tag;
    }) ? tag : '';
  }

  function applyFilter() {
    var tag = selectedTag();
    var count = 0;
    entries.forEach(function (entry) {
      entry.element.hidden = tag !== '' && entry.tags.indexOf(tag) === -1;
      if (!entry.element.hidden) count += 1;
    });
    years.forEach(function (year) {
      year.hidden = !Array.prototype.some.call(year.querySelectorAll('[data-archive-post]'), function (post) {
        return !post.hidden;
      });
    });
    controls.forEach(function (control) {
      if (control.getAttribute('data-tag-filter') === tag) {
        control.setAttribute('aria-current', 'true');
      } else {
        control.removeAttribute('aria-current');
      }
    });
    status.textContent = tag === '' ? 'Showing all ' + count + ' articles' :
      'Showing ' + count + (count === 1 ? ' article' : ' articles') + ' tagged “' + tag + '”';
  }

  filters.addEventListener('click', function (event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var control = event.target;
    while (control && control !== filters && !control.hasAttribute('data-tag-filter')) {
      control = control.parentElement;
    }
    if (!control || control === filters) return;

    event.preventDefault();
    var tag = control.getAttribute('data-tag-filter');
    var hash = tag === '' ? '' : '#tag=' + encodeURIComponent(tag);
    if (window.location.hash !== hash) {
      window.history.pushState(null, '', window.location.pathname + window.location.search + hash);
    }
    applyFilter();
  });

  window.addEventListener('hashchange', applyFilter);
  window.addEventListener('popstate', applyFilter);
  applyFilter();
  filters.hidden = false;
}());
