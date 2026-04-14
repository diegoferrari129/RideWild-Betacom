
import { ErrorHandler, Injectable, Injector } from "@angular/core";
import { NGXLogger } from "ngx-logger";

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

    constructor(private injector: Injector) {}

    handleError(error: any): void {
        const logger = this.injector.get(NGXLogger);

        let errorMessage: string = 'Errore non getisto: ';
        let errorContext: any = {};

        if (error instanceof Error) {
            errorMessage = error.message;
            errorContext = {
                name: error.name,
                stack: error.stack
            };
        } else if (typeof error === 'string') {
            errorMessage = error;
        } else if (error && typeof error === 'object') {
            errorMessage = error.message || error.toString();
            errorContext = error;
        }

        logger.error(`${errorMessage}`, errorContext);

        console.error('Global Error Handler:', error);
    }
};