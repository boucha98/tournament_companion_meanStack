import { Member } from './../models/member';
import { Router, Request, Response, NextFunction } from 'express';
import * as mongoose from 'mongoose';
import { Tournament, Game } from '../models/tournament';
import { AuthentificationRouter } from "./authentication.router";

export class TournamentsRouter {
    public router: Router;
    
    constructor() {
        this.router = Router();
        this.router.get('/count', this.getCount);
        this.router.get('/', this.getAll);
        this.router.get('/allsubscribed/:pseudo', this.getAllSubscribed);
        this.router.get('/mid/:id', this.getAllAvailabe);
        this.router.get('/:name', this.findByName);
        // à partir d'ici chaque méthode contrôle le token de la request -> admin ou membre connecté
        this.router.put('/:name', this.update);
        this.router.put('/game/:id', this.updateGame);
        // à partir d'ici il faut être admin
        this.router.use(AuthentificationRouter.checkAdmin);
        this.router.get('/byId/:id', this.findById);
        this.router.get('/byStartDate/:start', this.findByStartDate);
        this.router.get('/byFinishDate/:finish', this.findByFinishDate);
        this.router.get('/byMaxPlayers/:max', this.findByMaxPlayers);
        this.router.get('/byStartRange/:start/:finish', this.getRange);   
        this.router.post('/', this.create);
        this.router.post('/game/:name', this.addGame);
        this.router.delete('/:name', this.deleteOne);
        this.router.delete('/:start/:finish', this.deleteRange);
        this.router.delete('/game/:name/:id', this.deleteGame);
    }
    
    public getCount(req: Request, res: Response, next: NextFunction) {
        Tournament.count({}).exec((err, count) => {
            if (err) res.send(err);
            res.json(count);
        });
    }

    public getAll(req: Request, res: Response, next: NextFunction) {
        Tournament.find().populate('members').populate('games').sort({ name: 'asc' }).exec((err, tournaments) => {
            if (err) res.send(err);
            res.json(tournaments);
        });
    }

    public getAllSubscribed(req: Request, res: Response, next: NextFunction) {
        Member.findOne({ pseudo: req.params.pseudo }, (err, member) => {
            if (err) res.send(err)
            Tournament.find({ 'members': member._id }).populate('members').populate('games').sort({ name: 'asc' }).exec((err, tournaments) => {
                if(err) res.send(err);
                res.json(tournaments);
            });
        })
    }
    

	public getAllAvailabe(req: Request, res: Response, next: NextFunction) {
        Tournament.find({ $and: [{ $where: "this.maxPlayers > this.members.length && this.closed === false", 'members': {$ne: req.params.id}}] }).sort({ name: 'asc'}).exec((err, tournaments) => {
            if (err) res.send(err);
            res.json(tournaments);
        });
    }
    
    public findById(req: Request, res: Response, next: NextFunction) {
        Tournament.find({ _id: req.params.id })
            .then(member => res.json(member))
            .catch(err => res.json([]));
    }

    public findByName(req: Request, res: Response, next: NextFunction) {
        Tournament.find({ name: req.params.name }).populate('members').populate('games').exec((err, tournaments) => {
            if (err) res.send(err);
            res.json(tournaments);
        })
    }

    public findByStartDate(req: Request, res: Response, next: NextFunction) {
        let d = new Date(req.params.start);
        if (!isNaN(d.valueOf())) {
            Tournament.find({ start: d }).sort({ name: 'asc' })
                .then(members => res.json(members))
                .catch(err => res.json([]));
        }
        else
            res.json([]);
    }

    public findByFinishDate(req: Request, res: Response, next: NextFunction) {
        let d = new Date(req.params.finish);
        if (!isNaN(d.valueOf())) {
            Tournament.find({ finish: d }).sort({ name: 'asc' })
                .then(members => res.json(members))
                .catch(err => res.json([]));
        }
        else
            res.json([]);
    }

    public findByMaxPlayers(req: Request, res: Response, next: NextFunction) {
        Tournament.find({ maxPlayers: req.params.max }).sort({ name: 'asc' })
            .then(members => res.json(members))
            .catch(err => res.json([]));
    }

    public getRange(req: Request, res: Response, next: NextFunction) {
        let d1 = new Date(req.params.start);
        let d2 = new Date(req.params.finish);
        if (isNaN(d1.valueOf()) || isNaN(d2.valueOf()))
            res.json({errmsg: 'bad date range'});
        else {
            Tournament.find({ start: { $gte: d1, $lte: d2 } })
                .then(members => res.json(members))
                .catch(err => res.json([]));
        }
    }

    public create(req: Request, res: Response, next: NextFunction) {
        let tournament = new Tournament(req.body);
        tournament.save()
            .then(r => res.json(r))
            .catch(err => res.json(err));
    }

    public update(req: Request, res: Response, next: NextFunction) {
        if ( req['decoded'].admin) {
            Tournament.findOneAndUpdate({ name: req.params.name },
                req.body,
                { new: true })  // pour renvoyer le document modifié
                .then(r => res.json(r))
                .catch(err => res.json(err));
        } else if ( req['decoded'].pseudo ) {
            const tournament = new Tournament(req.body);
            Member.findOne({ pseudo: req['decoded'].pseudo }, (err, current) => {
                if (tournament.members.some(current._id)) {
                    Tournament.findOneAndUpdate({ name: req.params.name },
                        req.body,
                        { new: true })  // pour renvoyer le document modifié
                        .then(r => res.json(r))
                        .catch(err => res.json(err));
                }
            })
        } else {
            return res.status(403).send({
                success: false,
                message: 'Require admin privilege or own account modifications.'
            });
        }
        
    }

    public deleteOne(req: Request, res: Response, next: NextFunction) {
        Tournament.findOneAndRemove({ name: req.params.name })
            .then(r => res.json(true))
            .catch(err => res.json(err));
    }

    public deleteRange(req: Request, res: Response, next: NextFunction) {
        let d1 = new Date(req.params.start);
        let d2 = new Date(req.params.finish);
        if (isNaN(d1.valueOf()) || isNaN(d2.valueOf()))
            res.json({errmsg: 'bad date range'});
        else {
            Tournament.find({ start: { $gte: d1, $lte: d2 } })
                .remove()
                .then(r => res.json(true))
                .catch(err => res.json(err));
        }
    }

    public addGame(req: Request, res: Response, next: NextFunction){
        delete req.body._id;
        let name = req.params.name;
        let game = new Game(req.body);
        Tournament.findOne({ name: name })
            .then(t => {
                t.games.push(game);
                game.tournament = t;
                return game.save();
            })
            .then(g => {
                g.tournament.save();
                res.json(game);
            })
    }
    
    public deleteGame(req: Request, res: Response, next: NextFunction){
        let name = req.params.name;
        let id = req.params.id;
        Tournament.findOne({ name: name})
            .then(t => {
                let i = t.games.find(g => g._id == id);
                t.games.splice(i, 1);
                return t.save();
            })
            .then(t => {
                return Game.remove({ _id: id})
            })
            .then(() => res.json(true))
            .catch(err =>console.log(err))
    }

    public updateGame(req: Request, res: Response, next: NextFunction) {
        let id = req.params.id;
        let current = req['decoded'].pseudo; // seul un membre participant au Game peut le modifier (résultats)
        Game.findOneAndUpdate({ $and: [ {_id : id}, { $or: [{ member1: current }, { member2: current }] }] }, 
            req.body, 
            { new: true})
                .then(a => res.json(a))
                .catch(err => console.log(err));
    }

}