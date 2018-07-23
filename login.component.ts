import { AfterViewInit, Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { Platform } from '@angular/cdk/platform';

import { AppState } from '../../app.service';
import { languagesList } from '../../shared/languages';
import { environment } from '../../../../environments/environment';
import { LanguageService } from '../../services/common/translate-language.service';
import { FAQDialogComponent } from '../../dialogs/faq/faq';
import { DistrictService } from '../../services/district.service';
import { LoggerService } from '../../services/common/logger.service';
import { HelpersService } from '../../services/helpers.service';
import { FindMyDistrictDialogComponent } from '../find-my-district-dialog/find-my-district-dialog';
import { SessionService } from '../../services/auth/session.service';

@Component({
    selector: 'sc-login',
    styleUrls: ['./login.component.scss'],
    templateUrl: './login.component.html'
})

export class LoginComponent implements OnInit, OnDestroy, AfterViewInit {

    public isLoading: boolean = true;
    public serviceRetries = 1;
    public serviceSubscription;
    public isServiceAvailable: boolean;
    public environment = environment;
    public district: string = 'schoolcafe';
    public person: string = 'parent';
    public currentLanguage;
    public languagesList = languagesList;
    public onAppResume;

    constructor(public router: Router,
                public dialog: MatDialog,
                public formBuilder: FormBuilder,
                public renderer: Renderer2,
                public platform: Platform,
                public appState: AppState,
                public languageService: LanguageService,
                public districtService: DistrictService,
                public helpersService: HelpersService,
                public sessionService: SessionService,
                public logger: LoggerService) {

    }

    public ngOnInit() {
        this.setLanguage();

        /** Add class name for app styles */
        if (!this.environment.web) {
            const el = document.getElementById('homepage');
            if (el) {
                this.renderer.addClass(el, 'sc-app-layout');
            }
        }

        this.checkServiceStatus();

        /**
         * Create function to check service on app resume
         */
        this.onAppResume = () => {
            if (!this.isServiceAvailable) {
                this.checkServiceStatus();
            }
        };
        document.addEventListener('resume', this.onAppResume, false);

        this.appState.reset();
        this.sessionService.endSession();
    }

    public ngAfterViewInit() {
        if (!environment.web) {
            document.addEventListener('deviceready', () => {
                if (typeof StatusBar !== 'undefined') {
                    this.platform.IOS ? StatusBar.styleDefault() : StatusBar.styleLightContent();
                }
            }, false);
        }
        /** Reset Config to avoid conflicts in activated outlet */
        if (this.router.config.length > 0) {
            this.router.resetConfig(this.router.config);
        }
    }

    public ngOnDestroy() {
        if (this.serviceSubscription) {
            clearTimeout(this.serviceSubscription);
        }
        document.removeEventListener('resume', this.onAppResume, false);
    }

    /**
     * Checking APIs are sending 200 status code or not
     */
    public checkServiceStatus() {
        this.isLoading = true;
        this.districtService.getDistrictsBySearch(this.district, this.person)
            .subscribe(
                () => {
                    this.isLoading = false;
                    this.isServiceAvailable = true;
                }, () => {
                    this.isLoading = false;
                    this.isServiceAvailable = false;
                    if (this.serviceRetries <= 3) {
                        this.serviceRetries += 1;
                        this.serviceSubscription = setTimeout(() => {
                            this.checkServiceStatus();
                        }, 6000 * this.serviceRetries);
                    }
                }
            );
    }

    /**
     * Set language for translator
     */
    public setLanguage(lang?: string) {
        this.currentLanguage = lang || this.languageService.get();
        this.languageService.set(this.currentLanguage);
    }

    /**
     * How-To & FAQs
     */
    public openFAQDialog() {
        this.dialog.open(FAQDialogComponent);
    }

    public openFindMyDistrictDialog() {
        this.dialog.open(FindMyDistrictDialogComponent, {
            maxWidth: '100vw',
            maxHeight: '100vh',
            height: '100%',
            width: '100%',
            panelClass: 'full-screen-dialog',
            autoFocus: true,
            hasBackdrop: true,
            closeOnNavigation: true
        });
    }
}
