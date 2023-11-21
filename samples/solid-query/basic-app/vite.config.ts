import {defineConfig} from 'vite'
import solid from 'vite-plugin-solid'
import msw from "@iodigital/vite-plugin-msw";
import {getSwaggerPetstoreMSW} from "./src/api/endpoints/petstoreFromFileSpecWithTransformer.msw";

export default defineConfig({
    plugins: [solid(), msw({handlers: getSwaggerPetstoreMSW(), mode: 'node'})],
})
