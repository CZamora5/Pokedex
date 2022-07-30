const TOTAL_POKEMONS = 898;
const POKEMONS_PER_PAGE = 20;
const $nextButton = document.getElementById('next');
const $previousButton = document.getElementById('previous');
const $pageNumberText = document.getElementById('info-page-number');
const $selector = document.getElementById('select');
const $cards = document.getElementById('cards');
const $searchInput = document.getElementById('search');
const $modal = document.getElementById('modal');
const $favorites = document.querySelector('.favorites');
const $ascending = document.querySelector('.ascending');
const $msg = document.querySelector('.empty');
const $searchButton = document.querySelector('.search-btn');

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

$favorites.addEventListener('click', () => {
  pokemonsIds = FAVORITES;
  resetContent();
});

$ascending.addEventListener('click', () => {
  pokemonsIds.sort((a, b) => IDS_TO_NAMES[a] !== IDS_TO_NAMES[b] ? IDS_TO_NAMES[a] < IDS_TO_NAMES[b] ? -1 : 1 : 0);
  resetContent();
});

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
    typeColor = COLORS[type.type.name];
    acc[0] += typeColor[0];
    acc[1] += typeColor[1];
    acc[2] += typeColor[2];
    return acc;
  }, [0, 0, 0]);
  color = [Math.round(color[0] / types.length), Math.round(color[1] / types.length), Math.round(color[2] / types.length)];
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

function renderPagePromiseAll(page) {
  if (pokemonsIds.length === 0) {
    $msg.classList.remove('none');
    const $div = document.createElement('div');
    $div.classList.add('card');
    const $img = document.createElement('img');
    $img.src = './assets/placeholder.png';
    $div.appendChild($img);
    $cards.appendChild($div);
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
        const $fullCard = document.createElement('div');
        const $container = document.createElement('div');
        const $lowerContainer = document.createElement('div');
        $div.classList.add('card');
        $fullCard.classList.add('full-card');
        $container.classList.add('card-container');
        $lowerContainer.classList.add('card-container');
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
        
        displayTypes($fullCard, pokemonData.types);

        $star = document.createElement('img');
        $star.classList.add('star');
        $star.src = './assets/star.svg';

        $cardBody = document.createElement('div');
        $cardBody.classList.add('card-body');
        $cardBody.appendChild($pokemonInfo);
        $cardBody.appendChild($star);
        $lowerContainer.appendChild($cardBody);
        

        $fullCard.appendChild($container);
        $fullCard.appendChild($lowerContainer);
        handleFavorites($star, $container, $lowerContainer, pokemonData);


        // $div.appendChild($cardBody);
        $container.appendChild($div);
        $cards.appendChild($fullCard);

        $container.addEventListener('click', evt => {
          if (!evt.target.classList.contains('star')) {
            $modal.querySelector('.modal-img').src = imgFallback[pokemonData.id];
            $modal.querySelector('.name').innerText = pokemonData.name;
            const stats = $modal.querySelectorAll('.stat');
            const spans = $modal.querySelectorAll('span');

            const divs = document.querySelector('.pheno').querySelectorAll('div');
            divs[0].innerText = `Weight: ${pokemonData.weight/10} kg`;
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

function handleFavorites($elem, $card, $card2, pokemonData) {
  if (FAVORITES.includes(pokemonData.id)) {
    $card.classList.add('favorite');
    $card2.classList.add('favorite');
    $card.parentElement.classList.add('favorite');
    $elem.src = './assets/star2.svg';
  }

  $elem.addEventListener('click', () => {
    if ($card.classList.contains('favorite')) {
      $elem.src = './assets/star.svg';
      $card.parentElement.classList.remove('favorite');
      $card.classList.remove('favorite');
      $card2.classList.remove('favorite');
      FAVORITES.splice(FAVORITES.indexOf(pokemonData.id), 1);
      localStorage.setItem('@favorites', JSON.stringify(FAVORITES));
    } else {
      $elem.src = './assets/star2.svg';
      $card.parentElement.classList.add('favorite');
      $card.classList.add('favorite');
      $card2.classList.add('favorite');
      FAVORITES.push(pokemonData.id);
      FAVORITES.sort((a, b) => a- b);
      localStorage.setItem('@favorites', JSON.stringify(FAVORITES));
    }
  });
}

function getIds(pokemons) {
  return pokemons.map(pokemonData => pokemonData.pokemon.url.split('/').at(-2)).filter(id => id <= TOTAL_POKEMONS);
}

$nextButton.addEventListener('click', () => {
  if (currentPage >= pages) return;
  $cards.innerHTML = '';
  renderPagePromiseAll(++currentPage);
});

$previousButton.addEventListener('click', () => {
  if (currentPage === 1) return;
  $cards.innerHTML = '';
  renderPagePromiseAll(--currentPage);
});

$selector.addEventListener('change', evt => {
  const type = evt.target.value;
  filterPokemons(type, currentSearchString);
});

$searchButton.addEventListener('click', () => {
    let currentSearchString = $searchInput.value.trim().toLowerCase();
    let currentType = $selector.value;
    filterPokemons(currentType, currentSearchString);  
});

$searchInput.addEventListener('keypress', evt => {
  if (evt.key === 'Enter') {
    currentSearchString = evt.target.value.trim().toLowerCase();
    let currentType = $selector.value;
    filterPokemons(currentType, currentSearchString);    
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