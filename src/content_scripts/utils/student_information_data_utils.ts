import { InitialDataResponse, ProgramsResponse } from '../../types';
import {log} from "../../logger.ts";

export async function fetchInitialData(): Promise<InitialDataResponse> {
    const url = 'https://cs.cc.unc.edu/psc/campus/EMPLOYEE/SA/s/WEBLIB_HCX_RE.H_VW_UNOFF_TRANSCR.FieldFormula.IScript_InitialData?transcript_type=UNOFF&acad_career=UGRD';
    const headers = {
        'User-Agent': navigator.userAgent,
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Referer': 'https://cs.cc.unc.edu/psc/campus/EMPLOYEE/SA/s/WEBLIB_HCX_RE.H_VW_UNOFF_TRANSCR.FieldFormula.IScript_Main',
        'DNT': '1',
        'Sec-GPC': '1',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Priority': 'u=4'
    }
    try {
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: headers
        });
        const data = await response.json();
        log.debug('Fetching Initial Transcript data:', data);
        return data as InitialDataResponse;
    } catch (error) {
        log.debug('Error fetching Initial Transcript data:', error);
        throw error;
    }
}

export async function fetchPrograms(): Promise<ProgramsResponse> {
    const url = 'https://cs.cc.unc.edu/psc/campus/EMPLOYEE/SA/s/WEBLIB_HCX_RE.H_VW_UNOFF_TRANSCR.FieldFormula.IScript_Programs?institution=UNCCH&transcript_type=UNOFF&acad_career=UGRD';
    const headers = {
        'User-Agent': navigator.userAgent,
        "Accept": "application/json",
        "accept-language": "en-US,en;q=0.6",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "sec-gpc": "1",
        "Referer": "https://cs.cc.unc.edu/psc/campus/EMPLOYEE/SA/s/WEBLIB_HCX_RE.H_VW_UNOFF_TRANSCR.FieldFormula.IScript_Main",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    }
    try {
        const response = await fetch(url, {
            method: "GET",
            credentials: "include",
            headers: headers
        });

        const data = await response.json();
        log.debug('Fetching Programs data:', data);
        return data as ProgramsResponse;
    } catch (error) {
        log.error('Error fetching Programs data:', error);
        throw error;
    }
}