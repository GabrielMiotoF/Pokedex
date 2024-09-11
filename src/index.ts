// dei meu melhor mas ta uma bagunça

import express, { Request, Response } from "express";
import path from "path";

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, "views"));

app.get('/', function (request: Request, response: Response) {
    const limit = 20;
    const page = parseInt(request.query.page as string) || 1;
    const offset = (page - 1) * limit;
    const search = (request.query.search as string)?.trim().toLowerCase();

    if (search) {
        response.redirect(`/detalhar/${search}`);
    } else {
        fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`)
            .then(res => res.json())
            .then(data => {
                response.render("index", { results: data.results, page });
            })
            .catch(err => {
                console.error("Erro", err);
                response.status(500).send("Erro");
            });
    }
});

app.get('/detalhar/:name', function (request: Request, response: Response) {
    const pokemonName = request.params.name;

    fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`)
        .then(res => res.json())
        .then(pokemonData => {
            //informações de espécie
            return fetch(pokemonData.species.url)
                .then(res => res.json())
                .then(speciesData => {
                    if (speciesData.generation) {
                        // geração
                        const generationUrl = speciesData.generation.url;
                        const generationNumber = generationUrl.split("/").slice(-2, -1)[0];
                        pokemonData.generation = generationNumber;
                    }
                    if (speciesData.evolution_chain) {
                        //evolução
                        return fetch(speciesData.evolution_chain.url)
                            .then(res => res.json())
                            .then(evolutionChainData => {
                                const evolutions = [];
                                let evolution = evolutionChainData.chain;
                                
                                do {
                                    evolutions.push({
                                        name: evolution.species.name,
                                        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${evolution.species.url.split("/")[6]}.png`
                                    });
                                    evolution = evolution.evolves_to[0];
                                } while (evolution && evolution.evolves_to);


                                response.render("details", { 
                                    pokemon: pokemonData,
                                    types: pokemonData.types.map((type: any) => type.type.name),
                                    evolutions: evolutions
                                });
                            });
                    } else {
                        response.render("details", { 
                            pokemon: pokemonData,
                            types: pokemonData.types.map((type: any) => type.type.name),
                            evolutions: [] 
                        });
                    }
                });
        })
        .catch(err => {
            console.error("erro: ", err);
            response.status(500).send("Server Erro");
        });
});

app.get('/api/pokemon/suggestions', async function (request: Request, response: Response) {
    const query = (request.query.query as string)?.trim().toLowerCase();
    const limite = parseInt(request.query.limit as string) || 10; 

    if (!query) {
        response.json([]);
        return;
    }

    try {

        const maxResultados = 899;
        const fetchUrl = `https://pokeapi.co/api/v2/pokemon?limit=${maxResultados}`;
        const res = await fetch(fetchUrl);
        const data = await res.json();
        
        const suggestions = data.results
            .filter(pokemon => pokemon.name.toLowerCase().includes(query))
            .slice(0, limite);

        response.json(suggestions);
    } catch (err) {
        console.error("Erro", err);
        response.status(500).send("Server Errp");
    }
});

app.listen(3000, function () {
    console.log("http://localhost:3000");
});
