import { Component } from "@angular/core";
import { AuthService } from "app/auth.service";
import { Router } from "@angular/router";

@Component({
    template: ''
})

export class LogoutComponent {
    constructor(private authService: AuthService, private router: Router) {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}