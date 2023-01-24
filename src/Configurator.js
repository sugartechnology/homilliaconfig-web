import React, { useEffect, useState } from 'react'
import { Button, Form, Input, Progress, Table, Divider, Modal, Dropdown } from 'semantic-ui-react';
import axios from "axios";

const configurationsDataGlobal = [];
var viewForSave = false

const Configurator = props => {


    //view id
    const [viewId, setViewId] = useState("");




    //customer variables
    const [entityPrices, setEntityPrices] = useState([]);
    const [firmData, setFirmData] = useState({});
    //customer variables ends


    //configurator
    const [progressBarVisibility, setProgressBarVisible] = useState("block");
    const [progressBarPercent, setProgressBarPercent] = useState(0);
    const [configurationsData, setConfigurationsData] = useState([]);
    //configurator ends


    const [firmCode, setFirmCode] = useState("");
    const [selectedCurrency, setSelectedCurrency] = useState("TL");
    const [selectedCurrencyValue, setSelectedCurrencyValue] = useState(1);



    useEffect(() => {
        window.onAddFromConfigurator = onAddFromConfigurator.bind(this);
        window.onUpdatePriceConfigurator = onUpdatePriceConfigurator.bind(this);
        window.isPhone = isPhone.bind(this);
        window.isVr = isVr.bind(this);
        document.addEventListener("closeMode", closeModal);

        const enterVRButton = document.getElementById('entervr');
        const enterFullScreen = document.getElementById('enterFullScreen');
        document.addEventListener('onVRSupportedCheck', function (event) {
            enterVRButton.disabled = !event.detail.supported;
        }, false);


        enterVRButton.addEventListener('click', function (event) {
            window.unityInstance.Module.WebXR.toggleVR();
        }, false);

        enterFullScreen.addEventListener('click', function (event) {
            window.unityInstance.SetFullscreen(1);
        }, false);

        init();

    }, []);


    const init = async () => {

        createConfiguratorCanvas();

        var response = await requestNetwork('homillia/configurator/entity/list/');
        setEntityPrices(response.data);
        var response = await requestNetwork('homillia/configurator/entity/list/');
        setEntityPrices(response.data);
        console.log(response.data);
    }


    //configurator
    const createConfiguratorCanvas = () => {
        var buildUrl = "configurator/Build";
        var loaderUrl = buildUrl + "/web.loader.js";
        var config = {
            dataUrl: buildUrl + "/web.data",
            frameworkUrl: buildUrl + "/web.framework.js",
            codeUrl: buildUrl + "/web.wasm",
            streamingAssetsUrl: "StreamingAssets",
            companyName: "Homillia",
            productName: "3DConfigurator-Clean",
            productVersion: "0.1"
        };


        if (!document.getElementById("configurator-script-load")) {
            var script = document.createElement("script");
            script.src = loaderUrl;
            script.id = "configurator-script-load";
            script.onload = () => {
                const canvas = document.getElementById("unity-canvas");
                if (!canvas.created) {
                    canvas.created = true;
                    window.createUnityInstance(canvas, config, (progress) => {
                        setProgressBarPercent(progress * 100);
                    }).then((unityInstance) => {
                        window.unityInstance = unityInstance;
                        setProgressBarVisible("none");


                    }).catch((message) => {
                        alert(message);
                        setProgressBarVisible("none");
                    });
                }
            };
            document.body.appendChild(script);
        }
    }

    const onAddFromConfigurator = (dataString) => {
        var configuratorData = JSON.parse(dataString);
        console.log(configuratorData);

        if (viewForSave) {
            addConfiguratorAsView(configuratorData);
        }
        else {
            addConfiguratorToGlobal(configuratorData);
        }
    }


    const addConfiguratorToGlobal = (configuratorData) => {
        var cofiguratorOrderItem = {
            quantity: 1,
            currency: selectedCurrency,
        };

        if (configUpdateIndex > -1) {
            cofiguratorOrderItem = configurationsDataGlobal[configUpdateIndex];

        } else {
            configurationsDataGlobal.push(cofiguratorOrderItem);
        }

        cofiguratorOrderItem.configurator = configuratorData;
        cofiguratorOrderItem.price = configuratorData.price;


        setConfigurationsData([...configurationsDataGlobal]);
    }


    const addConfiguratorAsView = (configuratorData) => {
        viewForSave = false;
    }



    const onUpdatePriceConfigurator = (price) => {
        if (configUpdateIndex > -1) {
            configurationsDataGlobal[configUpdateIndex].price = price;
            setConfigurationsData([...configurationsDataGlobal]);
        }
    }

    function isVr() {
        return /Quest|Quest 2/i.test(navigator.userAgent);
    }

    function isPhone() {
        return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }
    //configurator




    //networks
    const requestNetwork = (url, parameter = '', payLoad = null) => {
        var promise = new Promise((resolve, reject) => {
            axios.post(process.env.REACT_APP_BACKEND_API + url + parameter,
                payLoad,
                {
                    headers: {
                        Authorization: process.env.REACT_APP_AUTHENTICATION,
                    }
                }).then((res) => {
                    resolve(res)
                }, (rej) => {
                    reject(rej)
                });
        });

        return promise;
    }

    const requestNetwork2 = (url, parameter = '', payLoad = null) => {
        var promise = new Promise((resolve, reject) => {
            axios.post(url + parameter,
                payLoad,
                {
                    headers: {
                        Authorization: process.env.REACT_APP_AUTHENTICATION,
                    }
                }).then((res) => {
                    resolve(res)
                }, (rej) => {
                    reject(rej)
                });
        });

        return promise;
    }
    //networks






    //Events
    //handle currency Change
    const handleCurrencyChange = async (e, { value }) => {
        setSelectedCurrency(value);
        const currencyResponse = await requestNetwork("homillia/customer/currency/get/", value);

        setSelectedCurrencyValue(0);
        if (currencyResponse && currencyResponse != "") {
            setSelectedCurrencyValue(currencyResponse.data);
        }

        window.unityInstance.SendMessage("CabinManager", "UpdateCurrency", value);
        window.unityInstance.SendMessage("CabinManager", "UpdateCurrencyValue", currencyResponse.data);



    }


    //handle customer change
    const handleCustomerChanged = async (e) => {
        openModal("Are you sure to Change Firm?", "onChangeFirm", "Change Firm");
        document.addEventListener("onChangeFirm", changeFirmCode);
    }

    const changeFirmCode = async () => {
        document.removeEventListener("onChangeFirm", changeFirmCode);

        configurationsDataGlobal.splice(0, configurationsDataGlobal.length);
        setConfigurationsData([]);
        setFirmData({});
        var responseFirm = await requestNetwork('homillia/customer/get/', firmCode);
        if (!responseFirm.data || responseFirm.data == {}) {
            console.log("firmData empty");
            return;
        }
        setFirmData(responseFirm.data);

        var parameter = {
            entities: entityPrices,
            currency: selectedCurrency,
            currencyValue: selectedCurrencyValue,
            rate: responseFirm.data.rate
        };

        var pricesString = JSON.stringify(parameter);
        window.unityInstance.SendMessage("CabinManager", "UpdateEntityPrices", pricesString);


        var responseOrder = await requestNetwork2('http://localhost:7980/api/homillia/order/customer/', firmCode);
        console.log(responseOrder);
    }


    //add new configuration
    const handleAddConfiguration = () => {
        console.log("addd");
        window.unityInstance.SendMessage("CabinManager", "SendNewConfiguration");
        setConfigUpdateIndex(-1);
        setConfigDeleteIndex(-1);
    }


    const handleAddNewConfiguration = () => {

        openModal("New Configuration Will be Saved ", "onAddNewConfiguration", "Save Configuration?");
        document.addEventListener("onAddNewConfiguration", onAddNewConfiguration.bind(this));


    }



    const handleLoadConfiguration = () => {
        openModal(" Configuration Will be load, You are going to loose your work", "onLoadConfiguration", "Load Configuration?");
        document.addEventListener("onLoadConfiguration", onLoadConfiguration);

        var rensposeGetConfiguration = requestNetwork("homillia/configuration/get/", viewId);
        if (!rensposeGetConfiguration.data || rensposeGetConfiguration.data != '')
            return;

        const configurationDb = rensposeGetConfiguration.data;
    }

    const onAddNewConfiguration = () => {
        document.removeEventListener("onAddNewConfiguration", onAddNewConfiguration);
        const confifurationView = {};
        viewForSave = true;
        window.unityInstance.SendMessage("CabinManager", "SendNewConfiguration");
        /*var rensposeGetConfiguration = requestNetwork("homillia/configuration/save/", '', confifurationView);
        if (!rensposeGetConfiguration.data || rensposeGetConfiguration.data != '')
            return;*/
    }


    const onLoadConfiguration = () => {
        document.removeEventListener("onLoadConfiguration", onLoadConfiguration);
        const confifurationView = {};
        /*var rensposeGetConfiguration = requestNetwork("homillia/configuration/save/", '', confifurationView);
        if (!rensposeGetConfiguration.data || rensposeGetConfiguration.data != '')
            return;*/
    }




    //load and update configuration
    const [configUpdateIndex, setConfigUpdateIndex] = useState(-1);
    const handleUpdateConfiguration = (i) => {
        console.log(i);
        console.log(configurationsDataGlobal[i]);
        setConfigUpdateIndex(i);
        const configurationDataString = JSON.stringify(configurationsDataGlobal[i].configurator);
        console.log("configurationDataString", configurationDataString);
        window.unityInstance.SendMessage("CabinManager", "LoadCabin", configurationDataString);
    }


    //delete configuration
    const [configDeletIndex, setConfigDeleteIndex] = useState(-1);
    const handleDeleteConfiguration = (i) => {
        setConfigDeleteIndex(i);
        openModal("Are you sure to delete Configuration?", "onConfigurationDelete", "Delete Configuration");
        document.addEventListener("onConfigurationDelete", onConfigurationDelete.bind(this));
    }


    const onConfigurationDelete = () => {
        console.log("deleteIndex", configDeletIndex);
        configurationsDataGlobal.splice(configDeletIndex, 1)
        setConfigurationsData(configurationsDataGlobal);
        document.removeEventListener("onConfigurationDelete", onConfigurationDelete.bind(this));
    }


    //quantity change
    const handleQuantityChange = (e, i) => {
        configurationsDataGlobal[i].quantity = e.target.value;
        setConfigurationsData([...configurationsDataGlobal]);
    }


    //on save promo
    const handleOnSaveClick = () => {
        openModal("Proformo will be created and sent to " + firmData.email, "onSendProformo", "Proformo");
        document.addEventListener("onSendProformo", onSaveClick);

    }



    const onSaveClick = async () => {
        document.removeEventListener("onSendProformo", onSaveClick);
        const configurationsDataToSend = configurationsDataGlobal.map(e => {
            return {
                configurator: {
                    currency: e.configurator.currency,
                    entities: e.configurator.entities,
                    loadbles: JSON.stringify(e.configurator.loadbles)
                },
                currency: e.currency,
                price: e.price,
                quantity: e.quantity
            }
        })
        const orderData = {
            customerCode: firmData.code,
            orderItems: configurationsDataToSend
        }

        console.log(orderData);
        const saveRenponse = await requestNetwork2("http://localhost:7980/api/homillia/order/save", "", orderData);
        console.log(saveRenponse);
        if (saveRenponse.data && saveRenponse.data != '') {
            configurationsDataGlobal.splice(0, configurationsDataGlobal.length);
            setConfigurationsData([...configurationsDataGlobal]);
            openModal("Done!", "closeModal", "Success")
        } else {
            openModal("Error!", "closeModal", "Erorr")
        }
    }





    /****MODAL *****/

    const [modalOpen, setModalOpen] = useState(false);
    const [modalText, setModalText] = useState("");
    const [modalHeader, setModelHeader] = useState("");
    const [modalEvent, setModalEvent] = useState("");
    const handleModal = () => {
        document.dispatchEvent(new Event(modalEvent));
        setModalOpen(false);
    }


    const openModal = (label, event, header = '') => {
        setModalOpen(true);
        setModalEvent(event);
        setModalText(label);
        setModelHeader(header);
    }

    const closeModal = () => {
        setModalOpen(false);
    }

    /****MODAL ENDS*****/
    return (
        < div className="App" >
            <div style={{ width: "900px", height: "700px", position: "relative", margin: "auto" }}>
                <div>
                    <canvas id="unity-canvas" style={{ width: "100%", height: "100%" }} />
                    <button id="entervr" value="Enter VR" style={{ float: "right" }}>VR</button>
                    <button id="enterFullScreen" value="Full Screen" style={{ float: "right" }}>Full Screen</button>
                </div>


                <Progress percent={progressBarPercent} color='brown'
                    style={{
                        display: progressBarVisibility,
                        position: "absolute",
                        top: "50%", left: "50%",
                        width: "80%",
                        transform: "translate(-50%, -50%)"
                    }} />
                <Divider hidden />
                <Dropdown
                    compact
                    floated="left"
                    search
                    selection
                    value={selectedCurrency}
                    onChange={handleCurrencyChange}
                    options={[
                        { key: 0, text: 'TL', value: 'TL' },
                        { key: 1, text: 'USD', value: 'USD' },
                    ]}
                    placeholder='Select Currency'
                />
                <Button
                    id='form-input-configurator-add'
                    floated='right'
                    onClick={e => { handleAddConfiguration(); }}> Add</Button>



                <Input id='id-view'
                    floated='right'>
                </Input>
                <Button
                    id='form-input-configurator-add'
                    floated='right'
                    onClick={e => { handleAddNewConfiguration(); }}> Add View</Button>

                <Button
                    id='form-input-configurator-add'
                    floated='right'
                    onClick={e => { handleLoadConfiguration(); }}> Get View</Button>
                <br></br>
                <br></br>
                <br></br>
                <Form onSubmit={handleCustomerChanged}>
                    <Form.Group inline >
                        <Form.Field
                            required
                            id='form-input-configurator-name'
                            control={Input}
                            onChange={(event) => setFirmCode(event.target.value)}
                            //onChange={setConfiguratorNameToAdd}
                            label='Customer Code'
                            placeholder='Customer Code'>
                        </Form.Field>


                        <Form.Field
                            id='form-input-configurator-change'
                            control={Button}
                            style={{ float: "right" }}> Change</Form.Field>



                        <Form.Field
                            id='form-input-firm-name'
                            control={Input}
                            value={firmData.firmName}
                            label='Firm Name'
                        >
                        </Form.Field>


                        <Form.Field
                            id='form-input-customer-name'

                            value={firmData.firstName}
                            control={Input}
                            //onChange={setConfiguratorNameToAdd}
                            label='Customer Name'
                        >
                        </Form.Field>
                    </Form.Group>

                </Form>
                <Divider hidden />
                <Table compact celled id="table" >
                    <Table.Header>
                        <Table.Row>

                            <Table.HeaderCell>Item</Table.HeaderCell>
                            <Table.HeaderCell>Product Detail</Table.HeaderCell>
                            <Table.HeaderCell>Quantity</Table.HeaderCell>
                            <Table.HeaderCell>Unity Price</Table.HeaderCell>
                            <Table.HeaderCell>Amount</Table.HeaderCell>
                            <Table.HeaderCell>Tax</Table.HeaderCell>
                            <Table.HeaderCell />
                            <Table.HeaderCell />

                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {configurationsData.map((configuration, i) => {
                            return (<Table.Row key={i + "_row"}>

                                <Table.Cell>{i + 1}</Table.Cell>
                                <Table.Cell>
                                    {
                                        configuration.configurator.entities.map((entity, j) => {
                                            return (
                                                <div>{entity.name}
                                                    {entity.childs.map((ent2) => {
                                                        return (<div>{ent2.name}</div>)
                                                    })}
                                                </div>);
                                        })}
                                </Table.Cell>

                                <Table.Cell><input type="text" id={i + "_quantity"}
                                    style={{ width: "40px" }}
                                    value={configuration.quantity}
                                    onChange={(e) => { handleQuantityChange(e, i); }}></input>
                                </Table.Cell>

                                <Table.Cell>{configuration.price.toFixed(2) + ' ' + configuration.currency}</Table.Cell>
                                <Table.Cell>{(configuration.quantity * configuration.price).toFixed(2) + ' ' + configuration.currency}</Table.Cell>
                                <Table.Cell>{configuration.tax + ' ' + configuration.currency}</Table.Cell>
                                <Table.Cell textAlign='right'>
                                    <Button size='mini' compact color='blue' onClick={(e) => { handleUpdateConfiguration(i) }}>U</Button>
                                </Table.Cell>
                                <Table.Cell textAlign='right'>
                                    <Button size='mini' compact color='red' onClick={(e) => { handleDeleteConfiguration(i) }}>X</Button>
                                </Table.Cell>
                            </Table.Row>)
                        })}
                    </Table.Body>

                </Table>

                <Button
                    floated='right'
                    size='mini'
                    color='green'
                    onClick={(e) => { handleOnSaveClick(); }}
                    disabled
                >
                    Save Proformo
                </Button>
            </div>


            <Modal open={modalOpen}>
                <Modal.Header>{modalHeader}</Modal.Header>
                <Modal.Content>
                    {modalText}
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={() => closeModal()} color='red'>
                        Cancel
                    </Button>
                    <Button onClick={() => handleModal()} color='green'>
                        Ok
                    </Button>
                </Modal.Actions>

            </Modal>
        </div >
    );
}

export default Configurator;