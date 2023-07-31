import { Client } from "@pepperi-addons/debug-server/dist";
import { HttpService } from "./http.service";

export interface EventResponse {
    Type: string;
    Data: any;
    Callback: string;
}

/**
 * A service for interacting with the CPI under a specific session
 * This service should be created using the {@link CpiSessionService} class.
 */
export class CPIService {

    httpService: HttpService;

    constructor(private client: Client, private webApiBaseUrl: string, private accessToken: string) {
        this.httpService = new HttpService(undefined, client.OAuthAccessToken);
    }

    private post(url: string, body: any): Promise<any> {
        return this.httpService.post(url, body, {
            Authorization: `Bearer ${this.client.OAuthAccessToken}`,
            PepperiSessionToken: this.accessToken 
        });
    }

    async emitEvent(eventKey: string, eventData: any): Promise<EventResponse> {
        const response = await this.post(this.webApiBaseUrl + '/EmitEvent', { 
            EventKey: eventKey,
            EventData: JSON.stringify(eventData)
        });
        
        return JSON.parse(response.Value);
    }

    async addonAPI(addonUUID: string, url: string, body: any): Promise<any> {
        const eventRes = await this.emitEvent('AddonAPI', {
            AddonUUID: addonUUID,
            RelativeURL: url,
            Method: 'POST',
            Body: body
        });

        if (eventRes.Type !== 'Finish') {
            throw new Error(`AddonAPI event has returned a client action of type ${eventRes.Type}, consider using an event loop`);
        }

        return eventRes.Data;
    }
}

/**
 * A service for interacting with the CPI running locally on a developer machine.
 */
export class LocalCPIService extends CPIService {

    constructor(client: Client) {
        super(client, '', '');
        const localCPIBaseURL = process.env.LOCAL_CPI_BASE_URL || 'http://localhost:8088';
        this.httpService = new HttpService(localCPIBaseURL, '');
    }

    async emitEvent(eventKey: string, eventData: unknown): Promise<EventResponse> {
        const res = await this.httpService.post('/debugger/emit_event', {
            EventKey: eventKey,
            EventData: eventData
        })
        return res;
    }
}