import * as http from 'http';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as mongoose from 'mongoose';
import * as jwt from 'jsonwebtoken';
import * as schedule from 'node-schedule';
import { Member, Address } from './models/member';
import { Tournament, Game } from './models/tournament';
import { MembersRouter } from './routes/members.router';
import { TournamentsRouter } from './routes/tournaments.router';
import { AuthentificationRouter } from "./routes/authentication.router";
import { MembersNoLogRouter } from './routes/members-no-log.router';

const MONGO_URL = 'mongodb://127.0.0.1/msn';

export class Server {
    private express: express.Application;
    private server: http.Server;
    private port: any;

    constructor() {
        this.express = express();
        this.middleware();
        this.mongoose();
        this.routes();
    }

    private middleware(): void {
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false }));
    }

    // initialise les routes
    private routes() {
        this.express.use('/api/token', new AuthentificationRouter().router);
        this.express.use('/api/members-no-log', new MembersNoLogRouter().router);
        this.express.use(AuthentificationRouter.checkAuthorization);    // à partir d'ici il faut être authentifié
        this.express.use('/api/members', new MembersRouter().router);
        this.express.use('/api/tournaments', new TournamentsRouter().router);
    }

    // initialise mongoose
    private mongoose() {
        (mongoose as any).Promise = global.Promise;     // see: https://stackoverflow.com/a/38833920
        let trials = 0;
        let connectWithRetry = () => {
            trials++;
            return mongoose.connect(MONGO_URL, err => {
                if (err) {
                    if (trials < 3) {
                        console.error('Failed to connect to mongo on startup - retrying in 2 sec');
                        setTimeout(connectWithRetry, 2000);
                    }
                    else {
                        console.error('Failed to connect to mongo after 3 trials ... abort!');
                        process.exit(-1);
                    }
                }
                else {
                    console.log('Connected to MONGODB');
                    this.initData();
                    // https://www.npmjs.com/package/node-schedule
                    // le package node-schedule permet d'exécuter des opérations à des moments donnés
                    // ci-dessous: gestion de la fermeture automatique des tournois selon la date, tous les jours à 10h00
                    let s = schedule.scheduleJob('0 10 * * *', function() {
                        Tournament.count({}).then(count => {
                            if (count > 0) {
                                this.automaticCloseTournaments();
                            }
                        })
                    })
                }
            });
        };
        connectWithRetry();
    }

    private initData() {
        Member.count({}).then(count => {
            if (count === 0) {
                console.log("Initializing data...");
                let addr1 = new Address({ "street_addr": "rue bazar 12", "postal_code": "1000", "localization": "Bxl" });
                let addr2 = new Address({ "street_addr": "rue machin 5", "postal_code": "1200", "localization": "Bxl" });
                let bruno = new Member({ pseudo: "bruno", password: "bruno", profile: "Hi, I'm bruno!", addresses: [addr1, addr2] });
                addr1.member = bruno;
                addr2.member = bruno;
                Address.insertMany([addr1, addr2]).then(_ => {
                    Member.insertMany([
                        { pseudo: "test", password: "test", profile: "Hi, I'm test!" },
                        { pseudo: "ben", password: "ben", profile: "Hi, I'm ben!" },
                        bruno,
                        { pseudo: "boris", password: "boris", profile: "Hi, I'm boris!" },
                        { pseudo: "alain", password: "alain", profile: "Hi, I'm alain!" }
                    ]);
                })
            }
        });

        Tournament.count({}).then(count => {
            if (count===0) {
                console.log("Initializing data Tournament...");
                let pawnGame = new Game({ game_name: "pawn-round1-game1", member1: "guy", member2: "laurent", memb1_score: 1, round: 1 });
                let guy = new Member({ pseudo: "guy", password: "guy", profile: "Hi, I'm guy!"});
                let laurent = new Member({ pseudo: "laurent", password: "laurent", profile: "Hi, I'm laurent!", admin: true });
                let raphael = new Member({ pseudo: "raphael", password: "raphael", profile: "Hi, I'm raphael!" });
                let pawn = new Tournament({ name: "pawn", start:"2018-03-01", finish: "2018-03-02", maxPlayers: 4, members:[guy, laurent], games: [pawnGame], closed: true });
                let knight = new Tournament({ name: "knight", start:"2018-03-13", finish: "2018-03-16", maxPlayers: 12, members:[guy, laurent, raphael] });
                Tournament.insertMany([pawn, knight]);
                pawnGame.tournament = pawn;
                guy.tournaments.push(pawn, knight); 
                laurent.tournaments.push(pawn, knight);
                raphael.tournaments.push(knight);
                Member.insertMany([guy, laurent, raphael]);
                Game.insertMany([pawnGame]);             
            }
        });    

        Member.count({ pseudo: 'admin' }).then(count => {
            if (count === 0) {
                console.log("Creating admin account...");
                let m = new Member({
                    pseudo: "admin", password: "admin",
                    profile: "I'm the administrator of the site!", admin: true
                });
                m.save();
            }
        });
    }

    private automaticCloseTournaments() {
        Tournament.find().populate('members').populate('games').sort({ name: 'asc' }).exec((err, tournaments) => {
            if (tournaments) {
                tournaments.forEach(t => {
                    const today = this.parseTodayDate();
                    const start = new Date(t.start);
                    const oneDayBefore = new Date(start);
                    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
                    // comparaison de 2 Date en JS: '===', '<=' et '>=' nécessitent d'utiliser getTime() au contraire de '<' ou '>'
                    if (!t.closed && (today.getTime() === oneDayBefore.getTime() ||
                            today.getTime() >= start.getTime())) {
                        this.gamesCreation(t);
                    }
                })
            }
        });
    }

    private parseTodayDate(): Date {
        const today = new Date();
        const yyyy = today.getFullYear().toString();
        let mm = (today.getMonth()+1).toString();
        mm = mm.length === 2 ? mm : '0' + mm;
        let dd  = today.getDate().toString();
        dd = dd.length === 2 ? dd : '0' + dd;
        return new Date(yyyy + '-' + mm + '-' + dd);
    }

    private gamesCreation(tournament) {
        // création des matchs basée sur un algorithme cyclique: https://en.wikipedia.org/wiki/Round-robin_tournament#Scheduling_algorithm 
        let list = [];
        tournament.members.forEach(m => { list.push(m); });
        
        if (list.length%2 !== 0) {
            // ajout d'un pseudo-membre si nombre de membres impair ("waiting..." dans console.log)
            list.push(new Member({pseudo: "waiting next round", password: "waiting next round"})); 
        }
        let nbServerRes = 0; // comptabiliser les réponses du serveur pour la création en db des games => si tous sont créés, on affiche un message info
        const nbRound = list.length - 1; // nombre de tours pour ce tournoi
        const half = list.length / 2; // nombre de matchs par tour
        for(let round = 0; round < nbRound; ++round) {
            for(let game = 0; game < half; ++game) {
                let player1 = list[(round + game) % nbRound];
                let player2 = list[(round + nbRound - game) % nbRound];
                if (game === 0) {
                    player2 = list[nbRound];
                }
                
                let newGame = new Game({ 
                    game_name: tournament.name+"-round"+(round+1)+"-game"+(game+1), 
                    member1: player1.pseudo, 
                    member2: player2.pseudo, 
                    round: (round+1), 
                    tournament: tournament 
                });
                Tournament.findOne({ name: tournament.name })
                .then(t => {
                    t.games.push(newGame);
                    newGame.tournament = t;
                    return newGame.save();
                })
                .then(g => {
                    ++nbServerRes;
                    if (nbServerRes === nbRound*half)
                        g.tournament.closed = true;
                    g.tournament.save();
                })
            }
        }
    }

    // démarrage du serveur express
    public start(): void {
        this.port = process.env.PORT || 3000;
        this.express.set('port', this.port);
        this.server = http.createServer(this.express);
        this.server.listen(this.port, () => console.log(`Node/Express server running on localhost:${this.port}`));
    }
}
