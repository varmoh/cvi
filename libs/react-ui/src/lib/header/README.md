## Export Components

### General information

Changelog file could be found here [link](CHANGELOG.md)

## Creating package

To create npm package for export components:
* Navitage to : `exportcomponents` root directory 
* Run `npm pack` command to create package locally
  * If you made updates to the package please relate to this [file](MAKING_CHANGES.md) before creating package

To publish npm newely created package:
* Run `npm publish --access public`
* Authorize in npm and package would be published

## Adding dependency from remote
- Since this package currently being deployed to @exirain account therefore it would need to be related from @exirain
- Add to `package.json` @exirain/header: followed by version, list of available version could be found [here](CHANGELOG.md)

## Adding dependency as local package
- When you build the package file, put it in `root` directory of the application
- Add to `package.json` @exirain/header: file:name-of-the-generated-package
  - If having import issues like `NOT FOUND` try adding to `vite.config.ts` 
    `resolve: {
    alias: {
        '@exirain': `${path.resolve(__dirname, 'node_modules/@exirain/header/src')}`
        },
    }`

## Using package
* Importing components
  * `import { Header } from '@exirain/header/src/index'` for Header only
  * `import { Header, MainNavigation } from '@exirain/header/src/index'` for Header and Menu
* Make sure that App.tsx fetches initial user info and stores it in store that provided by application
    * If you want to use local package, put created package to the root of react app and add depenency like "@exirain/header": "file:exirain-header-0.0.5.tgz" (use proper version)
### Using MainNavigation component
  * In Layout component you need to provide fetching and caching the `menu.json` file, code snippet would be:  
    const CACHE_NAME = 'mainmenu-cache';  
     const [MainMenuItems, setMainMenuItems] = useState([])   
     const  {data, isLoading, status}  = useQuery({   
     queryKey: [import.meta.env.REACT_APP_MENU_URL + import.meta.env.REACT_APP_MENU_PATH],   
     onSuccess: (res: any) => {   
     try {  
        setMainMenuItems(res);  
        localStorage.setItem(CACHE_NAME, JSON.stringify(res));  
     } catch (e) {  
        console.log(e);  
     }},  
     onError: (error: any) => {  
        setMainMenuItems(getCache());  
     }
     });
     function getCache(): any {  
        const cache = localStorage.getItem(CACHE_NAME) || '{}';  
        return JSON.parse(cache);  
     }
  * Then pass this MainMenu items to menu component `<MainNavigation items={MainMenuItems}/>`
    * If you want to use only local file provided by package then pass empty array instead `[]`
### Using Header component
* Example of using header component  
  <Header  
    baseUrlV2={import.meta.env.REACT_APP_RUUTER_V2_PRIVATE_API_URL}  
    baseUrl={import.meta.env.REACT_APP_RUUTER_V1_PRIVATE_API_URL}  
    analticsUrl={import.meta.env.REACT_APP_RUUTER_V2_ANALYTICS_API_URL}  
  user={useUserInfoStore.getState()}  
  />
* Make sure all these variables are set in .env file or docker-compose file
* Using user store is critical for header to function since it contains information about user that would be shown in Header
  * User store script in examples folder
  * You must fetch initial data in App.tsx file and then delegate it to header for displaying

### Implemented examples:
* https://github.com/buerokratt/Training-Module
* https://github.com/buerokratt/Service-Module
* https://github.com/buerokratt/Analytics-Module
