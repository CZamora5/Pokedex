// fetch('https://ghibliapi.herokuapp.com/films')
//   .then(response => response.json())
//   .then(data => renderData(data))
//   .catch(err => console.error(err));

  // fetch('https://api.jikan.moe/v4/anime')
//   .then(response => response.json())
//   .then(data => console.log(data))
//   .catch(err => console.error(err));
const TOTAL_POKEMONS = 898;
const POKEMONS_PER_PAGE = 20;
const $nextButton = document.getElementById('next');
const $previousButton = document.getElementById('previous');
const $pageNumberText = document.getElementById('info-page-number');
const $selector = document.getElementById('select');
const $cards = document.getElementById('cards');
const $searchInput = document.getElementById('search');
const $modal = document.getElementById('modal');
const COLORS = {  
  bug: [141, 155, 32],
  dark: [80, 68, 60],
  dragon: [143, 132, 187],
  electric: [210, 162, 60],
  fairy: [191, 149, 190],
  fighting: [126, 85, 73],
  fire: [189, 66, 42],
  flying: [149, 157, 194],
  ghost: [149, 157, 194],
  grass: [134, 176, 102],
  ground: [183, 165, 116],
  ice: [113, 196, 224],
  normal: [222, 221, 221],
  poison: [137, 91, 138],
  psychic: [182, 96, 125],
  rock: [159, 145, 94],
  steel: [163, 163, 169],
  water: [84, 141, 195]
};
const IDS_TO_NAMES = {};
const NAMES_TO_IDS = {};
const FAVORITES = JSON.parse(localStorage.getItem('@favorites')) ?? [];
let currentPage = 1;
let pokemonsIds = new Array(TOTAL_POKEMONS).fill(0).map((_, index) => index + 1);
let pages = Math.ceil(pokemonsIds.length / POKEMONS_PER_PAGE);
let currentSearchString = '';

document.querySelector('.close-modal').addEventListener('click', () => {
  $modal.close();
  $modal.classList.add('none');
  $modal.querySelector('.modal-img').src = './assets/placeholder.png';
});

const imgFallback = {};
for (let i = 1; i <= TOTAL_POKEMONS; i++) {
  let index = String(i).padStart(3, '0');
  imgFallback[i] = `https://assets.pokemon.com/assets/cms2/img/pokedex/detail/${index}.png`;
}

(function getNames() {
  let reqs = [], resultsPerPage = 256;
  for(let i = 0; i < Math.ceil(TOTAL_POKEMONS / resultsPerPage); i++) {
    reqs.push(`https://pokeapi.co/api/v2/pokemon?offset=${resultsPerPage * i}&limit=256`);
  }

  Promise.all(reqs.map(req => fetch(req)))
    .then(responses => Promise.all(responses.map(res => res.json())))
    .then(jsonArray => {
      jsonArray.forEach(data => {
        data.results.forEach(pokemon => {
          let id = pokemon.url.split('/').at(-2);
          if (id <= TOTAL_POKEMONS) {
            IDS_TO_NAMES[id] = pokemon.name;
            NAMES_TO_IDS[pokemon.name] = id;
          }
        });
      });
    });
})();

function assignColor(types) {
  if (types.length === 1) {
    typeColor = COLORS[types[0].type.name];
    return `rgb(${typeColor[0]}, ${typeColor[1]}, ${typeColor[2]})`;
  }
  let color = types.reduce((acc, type) => {
    // console.log(type.type.name);
    typeColor = COLORS[type.type.name];
    acc[0] += typeColor[0];
    acc[1] += typeColor[1];
    acc[2] += typeColor[2];
    return acc;
  }, [0, 0, 0]);
  color = [Math.round(color[0] / types.length), Math.round(color[1] / types.length), Math.round(color[2] / types.length)];
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

function renderPage(page) {
  for(let i = POKEMONS_PER_PAGE * (page - 1); i < Math.min(POKEMONS_PER_PAGE * page, pokemonsIds.length); i++) {
    fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonsIds[i]}`)
      .then(response => response.json())
      .then(pokemonData => {
          const $div = document.createElement('div');
          $div.classList.add('card');
          $div.style.backgroundColor = assignColor(pokemonData.types);
          const $img = document.createElement('img');
          $img.src = pokemonData['sprites']['other']['official-artwork']['front_default'];
          $img.onerror = function handleError() {
            this.onerror = null; 
            this.src = imgFallback[pokemonData.id];
          }
          $p = document.createElement('p');
          $p.innerText = pokemonData.name;
          $div.appendChild($img);
          $div.appendChild($p);
          $cards.appendChild($div);
      })
      .catch(err => console.error(err));
  }
}
const $msg = document.querySelector('.empty');

function renderPagePromiseAll(page) {
  if (pokemonsIds.length === 0) {
    $msg.classList.remove('none');
  } else {
    $msg.classList.add('none');
  }
  $pageNumberText.innerText = `Page ${page} of ${Math.max(pages, 1)}`;
  let reqs = [];
  for(let i = POKEMONS_PER_PAGE * (page - 1); i < Math.min(POKEMONS_PER_PAGE * page, pokemonsIds.length); i++) {
    reqs.push(`https://pokeapi.co/api/v2/pokemon/${pokemonsIds[i]}`);
  }

  Promise.all(reqs.map(url => fetch(url)))
    .then(res => Promise.all(res.map(data => data.json())))
    .then(jsonData => {
      jsonData.forEach(pokemonData => {
        const $div = document.createElement('div');
        const $container = document.createElement('div');
        $div.classList.add('card');
        $container.classList.add('card-container');
        $div.style.backgroundColor = assignColor(pokemonData.types);
        $container.style.backgroundColor = assignColor(pokemonData.types);
        const $img = document.createElement('img');
        $img.src = pokemonData['sprites']['other']['official-artwork']['front_default'];
        $img.onerror = function handleError() {
          this.onerror = null; 
          this.src = imgFallback[pokemonData.id];
        }

        $pokemonInfo = document.createElement('div');
        $p = document.createElement('p');
        $p2 = document.createElement('p');
        $p.innerText = pokemonData.name;
        $p2.innerText = `ID: ${pokemonData.id}`;
        $div.appendChild($img);
        $pokemonInfo.appendChild($p);
        $pokemonInfo.appendChild($p2);
        
        displayTypes($container, pokemonData.types);

        $star = document.createElement('img');
        $star.classList.add('star');
        $star.src = './assets/star_icon.png';
        handleFavorites($star, $container, pokemonData);

        $cardBody = document.createElement('div');
        $cardBody.classList.add('card-body');
        $cardBody.appendChild($pokemonInfo);
        $cardBody.appendChild($star);

        $div.appendChild($cardBody);
        $container.appendChild($div);
        $cards.appendChild($container);

        $container.addEventListener('click', evt => {
          if (!evt.target.classList.contains('star')) {
            // console.log('open');
            $modal.querySelector('.modal-img').src = imgFallback[pokemonData.id];
            $modal.querySelector('.name').innerText = pokemonData.name;
            const stats = $modal.querySelectorAll('.stat');
            const spans = $modal.querySelectorAll('span');

            const divs = document.querySelector('.pheno').querySelectorAll('div');
            divs[0].innerText = `Weight: ${pokemonData.weight/10} kg`;
            // console.log(pokemonData.weight, pokemonData.height);
            divs[1].innerText = `Height: ${pokemonData.height/10} m`;

            stats.forEach((stat, index) => {
              stat.value = Number(pokemonData.stats[index]['base_stat']);
              spans[index].innerText = `${spans[index].textContent.split(':')[0]}: ${pokemonData.stats[index]['base_stat']}`;
            });
            $modal.classList.remove('none');
            $modal.showModal();
            // let width = Number(window.getComputedStyle($modal.querySelector('.stat')).getPropertyValue('width'));
          }
        });
      });
    });
}

function displayTypes($elem, types) {
  let $firstType = document.createElement('img');
  $firstType.classList.add('first-type');
  $firstType.src = `./assets/${types[0].type.name}_type.png`;
  $elem.appendChild($firstType);
  
  if (types.length === 2) {
    let $secondType = document.createElement('img');
    $secondType.classList.add('second-type');
    $secondType.src = `./assets/${types[1].type.name}_type.png`;
    $elem.appendChild($secondType);
  } 
}

function handleFavorites($elem, $card, pokemonData) {
  if (FAVORITES.includes(pokemonData.id)) {
    $card.classList.add('favorite');
  }

  $elem.addEventListener('click', () => {
    if ($card.classList.contains('favorite')) {
      $card.classList.remove('favorite');
      FAVORITES.splice(FAVORITES.indexOf(pokemonData.id), 1);
      localStorage.setItem('@favorites', JSON.stringify(FAVORITES));
    } else {
      $card.classList.add('favorite');
      FAVORITES.push(pokemonData.id);
      localStorage.setItem('@favorites', JSON.stringify(FAVORITES));
    }
  });
}

function getIds(pokemons) {
  return pokemons.map(pokemonData => pokemonData.pokemon.url.split('/').at(-2)).filter(id => id <= TOTAL_POKEMONS);
}

$nextButton.addEventListener('click', () => {
  if (currentPage === pages) return;
  $cards.innerHTML = '';
  renderPagePromiseAll(++currentPage);
  // console.log(currentPage);
});

$previousButton.addEventListener('click', () => {
  if (currentPage === 1) return;
  $cards.innerHTML = '';
  renderPagePromiseAll(--currentPage);
  // console.log(currentPage);
});

$selector.addEventListener('change', evt => {
  const type = evt.target.value;
  filterPokemons(type, currentSearchString);
});

$searchInput.addEventListener('keypress', evt => {
  if (evt.key === 'Enter') {
    currentSearchString = evt.target.value.trim().toLowerCase();
    let currentType = $selector.value;
    filterPokemons(currentType, currentSearchString);
    // let names = Object.keys(NAMES_TO_IDS).sort((a, b) => NAMES_TO_IDS[a] - NAMES_TO_IDS[b]);
    // pokemonsIds = names.filter(name => name.includes(currentSearchString)).map(name => NAMES_TO_IDS[name]);
    
  }
});

function filterPokemons(type, searchString) {
  if (type === 'all') {
    pokemonsIds = new Array(TOTAL_POKEMONS).fill(0).map((_, index) => index + 1);
    pokemonsIds = pokemonsIds.filter(id => IDS_TO_NAMES[id].includes(searchString));
    resetContent();
  } else {
    fetch(`https://pokeapi.co/api/v2/type/${type}`)
      .then(response => response.json())
      .then(data => {
        pokemonsIds = getIds(data.pokemon);
        pokemonsIds = pokemonsIds.filter(id => IDS_TO_NAMES[id].includes(searchString));
        resetContent();
      })
      .catch(err => console.error(err));
  }
}

function resetContent() {
  $cards.innerHTML = '';
  currentPage = 1;
  $cards.appendChild($msg);
  pages = Math.ceil(pokemonsIds.length / POKEMONS_PER_PAGE);
  renderPagePromiseAll(currentPage);
}

renderPagePromiseAll(currentPage);

// let types = {1: 0, 2: 0};

// for(let i = 1; i <= TOTAL_POKEMONS; i++) {
//   fetch(`https://pokeapi.co/api/v2/pokemon/${i}`)
//     .then(response => response.json())
//     .then(pokemonData => {
//       types[pokemonData.types.length]++;
//       console.log(types);
//     })
//     .catch(err => console.error(err));
// }

