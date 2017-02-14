// Teplate Scripts
$(window).load(function() {

  $('.box-img a').hover(
    function () { $(this).find('img').stop().animate({ opacity: '.7' }, 250); },
    function () { $(this).find('img').stop().animate({ opacity: '1' },  250); });

  // IPad/IPhone
	var viewportmeta = document.querySelector &&
                     document.querySelector('meta[name="viewport"]'),
      ua = navigator.userAgent,

    gestureStart = function () {
        viewportmeta.content = 'width=device-width, minimum-scale=0.25, maximum-scale=1.6';
    },

    scaleFix = function () {
      if (viewportmeta && /iPhone|iPad/.test(ua) && !/Opera Mini/.test(ua)) {
        viewportmeta.content = 'width=device-width, minimum-scale=1.0, maximum-scale=1.0';
        document.addEventListener('gesturestart', gestureStart, false);
      }
    };

    scaleFix();

    Aero.init();
});

var Aero = {},
    Handlebars = window.Handlebars;

Aero.init = function () {
  Aero.prepSearchObject();

  $('#searchBtn').on('click', Aero.onSearchClick);
  $('#searchInput').on('keyup', _.debounce(Aero.onSearchKeyUp, 250));
};

Aero.cancelEvent = function (e) {
  if (!e) { return false; }
  e.preventDefault();
  e.stopPropagation();
  return false;
};

Aero.log = function (str) {
  console.log(str);
};

Aero.onSearchClick = function (e) {
  var $input = $('#searchInput'),
      search = $input.val();
  Aero.log('Search button clicked');
  Aero.cancelEvent(e);
  if (search.trim().length > 0) {
    window.location = 'search.html?' + search;
  }
  return false;
};

Aero.onSearchKeyUp = function (e) {

  if (e) {
    Aero.log('Search key pressed ' + e.keyCode);
    if (e.keyCode === 13) {
      Aero.onSearchClick();
      return Aero.cancelEvent(e);
    }
  }

  // No autofill on mobile
  if ($(window).width() < 768) {
    return Aero.cancelEvent(e);
  }

  Aero.renderSearchResultsBox($('#search-results'));
  return Aero.cancelEvent(e);
};

Aero.renderSearchResultsBox = function ($results, search) {
  var $input = $('#searchInput'),
      $button = $('#searchBtn'),
      search = $input.val(),
      width;

  if (search.trim() === '') {
    Aero.hideSearchResults();
    return;
  }

  Aero.renderSearchResults($results, search, true);

  width = ($input.outerWidth() + $button.outerWidth());
  $results.css({ top: ($input.position().top + $input.outerHeight()) + 'px',
                 'max-height': ($(window).height() * 0.7) + 'px',
                 'margin-left': -(600 - width + 22) + 'px' });

  $results.on('click', Aero.onSearchResultDivClick);
  $(document.body).on('click', Aero.onBodyClick);

  $results.show();
};

Aero.renderSearchResults = function ($results, search, fromBox) {
  Aero.renderSearchResultsByType($results.find('ul.stocked'),
                                 Aero.search.stockedProducts, search, fromBox);
  Aero.renderSearchResultsByType($results.find('ul.spec85285'),
                                 Aero.search.spec85285, search, fromBox);
  Aero.renderSearchResultsByType($results.find('ul.eclipse'),
                                 Aero.search.eclipse, search, fromBox);
};

Aero.renderSearchResultsByType = function ($resultsUl, products, search, fromBox) {
  var regex, results, $noResults, $tooMany;

  $resultsUl.empty();

  function matchTerm(r) {
    return regex.test(r.name + ' ' +
                      r.desc + ' ' +
                      _.pluck(r.components, 'name').join(' '));
  }

  console.log('searching for ' + search);

  // Search on individual terms one by one
  search = search.replace(/ +/g, ' ').split(' ');
  results = products;
  while (search.length > 0) {
    regex = new RegExp(search.pop(), 'i');
    results = _.filter(results, matchTerm);
  }

  $resultsUl.empty();

  $noResults = $resultsUl.parent().find('.no-results');
  $tooMany = $resultsUl.parent().find('.too-many-results');

  if (Aero.prepSearchObjectDfd.state() === 'pending') {
    return;
  } else if (results.length === 0) {
    $noResults.show();
    $tooMany.hide();
  } else if (results.length > 50 && fromBox) {
    $noResults.hide();
    $tooMany.show();
  } else {
    $noResults.hide();
    $tooMany.hide();
    // Fill in results
    _.each(results, _.partial(Aero.renderSearchResult, $resultsUl));
  }
};

Aero.onSearchResultDivClick = function (e) {
  if (!$(e.target).is('a')) {
    return Aero.cancelEvent(e);
  }
  e.stopPropagation();
};

Aero.onBodyClick = function (e) {
  Aero.hideSearchResults();
  $('#search-results').off('click', Aero.onSearchResultDivClick);
  $(document.body).off('click', Aero.onBodyClick);
  return Aero.cancelEvent(e);
};

Aero.renderSearchResult = function ($list, result, i) {
  var $li = $('<li/>'),
      $components = $('<p/>', { class: 'components' });

  $li.append($('<p/>')
               .append($('<span/>', { class: 'name' }).append(result.name)));

  if (result.desc && result.desc.length > 0) {
    $li.find('p').append($('<span/>', { class: 'desc' }).append(' - ' + result.desc));
  }

  $components.append($('<a/>', { href: result.file,
                                 target: '_blank' })
                       .append('Technical Data Sheet'));

  for (i = 0; i < result.components.length; i++) {
    $components.append(', ');
    $components.append($('<a/>', { href: result.components[i].file,
                                   target: '_blank' })
                         .append(result.components[i].name));
  }
  $li.append($components);
  $list.append($li);
};

Aero.hideSearchResults = function () {
  var $results = $('#search-results');
  $results.hide();
  $results.find('ul').empty();
  $('#searchInput').val('');
};

Aero.prepSearchObject = function () {
  if (Aero.prepSearchObjectDfd) { return; }

  Aero.prepSearchObjectDfd = new $.Deferred();

  function doSearch() {
    Aero.onSearchKeyUp();
  }

  // Try a search once the results are loaded, in case the user starts
  // typing beforehand
  Aero.prepSearchObjectDfd.done(doSearch);

  Aero.search = {
    stockedProducts: [],
    spec85285: [],
    eclipse: []
  };

  function createSearchObj(obj) {
    return _(obj.byType)
             .flatten()
             .pluck('groups')
             .flatten()
             .pluck('products')
             .flatten()
             .value();
  }

  function success(stockedProducts, spec85285, eclipse) {
    Aero.search.stockedProducts = createSearchObj(stockedProducts[0]);
    Aero.search.spec85285 = createSearchObj(spec85285[0]);
    Aero.search.eclipse = createSearchObj(eclipse[0]);
    $('#search-results .loading').hide();
    Aero.prepSearchObjectDfd.resolve();
  }

  function error(e) {
    Aero.log('Error initializing search object!' + e);
    Aero.prepSearchObjectDfd.reject();
  }

  $.when($.ajax('json/stockedProducts.json'),
         $.ajax('json/spec85285.json'),
         $.ajax('json/eclipse.json')).then(success, error);
};
