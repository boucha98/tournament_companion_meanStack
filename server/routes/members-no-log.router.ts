import { Router, Request, Response, NextFunction } from 'express';
import * as mongoose from 'mongoose';
import Member from '../models/member';

export class MembersNoLogRouter {
    public router: Router;
    
        constructor() {
            this.router = Router();
            
            this.router.post('/', this.create);
            this.router.get('/used/:pseudo', this.isUsed);
        }

        public create (req: Request, res: Response, next: NextFunction) {
            delete req.body._id;    // _id vient avec la valeur nulle d'angular (via reactive forms) 
                                    // => on doit l'enlever pour qu'il reçoive une valeur 
            let member = new Member(req.body);
            member.save(function (err, task) {
                if (err) res.send(err);
                res.json(task);
            }); 
        }

        public isUsed (req: Request, res: Response, next: NextFunction) {
            Member.count({ pseudo: req.params.pseudo })
            .then(count => res.json(count == 0))
            .catch(err => res.send(err));
        }
}