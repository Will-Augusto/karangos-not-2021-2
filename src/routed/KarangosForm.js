import * as React from 'react'
import TextField from '@mui/material/TextField'
import { makeStyles } from '@mui/styles'
import InputMask from 'react-input-mask'
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import DatePicker from '@mui/lab/DatePicker';
import ptLocale from 'date-fns/locale/pt-BR';
import MenuItem from '@mui/material/MenuItem'
import Toolbar from '@mui/material/Toolbar'
import Button from '@mui/material/Button'
import validator from 'validator'
import { validate as cpfValidate } from 'gerador-validador-cpf'
import { isFuture as dateIsFuture, isValid as dateIsValid } from 'date-fns'
import axios from 'axios'
import Snackbar from '@mui/material/Snackbar'
import { useHistory } from 'react-router-dom'
import ConfirmDialog from '../ui/ConfirmDialog'

const useStyles = makeStyles(theme => ({
  form: {
    maxWidth: '80%',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    '& .MuiFormControl-root': {
      minWidth: '200px',
      maxWidth: '500px',
      marginBottom: '24px',
    }
  },
  toolbar: {
    width: '100%',
    justifyContent: 'space-around'
  }
}))

export default function KarangosForm() {

  const classes = useStyles()
  const history = useHistory()

  const [state, setState] = React.useState({
    carro: {},   // Objeto vazio
    errors: {},
    isFormValid: false,
    isSnackOpen: false,
    snackMessage: '',
    isServerError: false,
    sendBtnLabel: 'Enviar',
    isDialogOpen: false
  })
  const { carro, errors, isFormValid, isSnackOpen, snackMessage, 
    isServerError, sendBtnLabel, isDialogOpen } = state

  function handleInputChange(event, field = event.target.id) {
    // Depuração
    console.log(event)

    // Preenche a variável de estado "cliente"
    // com os valores dos inputs
    const newCarro = {...carro}

    // Chama a validação do formulário
    const newErrors = formValidate(newCarro)
    const newIsFormValid = Object.keys(newErrors).length === 0  // Sem erros
    
    setState({...state, carro: newCarro, errors: newErrors, isFormValid: newIsFormValid})
  }

  function formValidate(fields) {
    const newErrors = {}
    // Validação do campo "nome": no mínimo 5 caracteres, devendo ter pelo
    // menos um espaço em branco entre eles
    if(!fields.marca) {
      newErrors.marca = 'Informe a marca'
    }
    return newErrors
  }

  function handleSubmit(event) {

    // Evita o recarregamento da página após o envio do formulário
    event.preventDefault()

    // Salva os dados no servidor se o formulário estiver válido
    if(isFormValid) saveData()

  }

  function isFormTouched() {

    // Percorrer o objeto "cliente" para ver se houve alteração nos
    // campos do formulário
    for(let field in carro) {
      // Há pelo menos um campo com conteúdo
      if(carro[field] !== '') return true
    }

    return false

  }

  function saveData() {

    // Muda o texto do botão de enviar e o desabilita, para evitar envios repetidos
    setState({...state, sendBtnLabel: 'Enviando...'})

    axios.post('https://api.faustocintra.com.br/karangos', carro)
    .then(
      // Callback se der certo
      () => {
        setState({
          ...state,
          isSnackOpen: true,
          snackMessage: 'Dados salvos com sucesso.',
          isServerError: false,
          sendBtnLabel: 'Enviar'
        })
      }
    )
    .catch(
      // Callback se der errado
      error => {
        setState({
          ...state,
          isSnackOpen: true,
          snackMessage: 'ERRO: ' + error.message,
          isServerError: true,
          sendBtnLabel: 'Enviar'
        })
      }
    )
  }

  function handleSnackClose(event, reason) {
    // Evita que o snackbar seja fechado clicando-se fora dele 
    if (reason === 'clickaway') return
    
    // Fechamento em condições normais
    setState({...state, isSnackOpen: false})

    // Quando não há erro de servidor, após o fechamento do snackbar
    // retornamos ao componente de listagem
    if(!isServerError) history.push('/karangos')
  }

  function handleDialogClose(answer) {

    // Se o usuário responder OK à pergunta, volta
    // para a página anterior (mesmo perdendo dados)
    if(answer) history.goBack()

    setState({...state, isDialogOpen: false}) // Fecha a caixa de diálogo
  }

  function handleBackBtnClick() {

    // Se o formulário estiver alterado, é necessário
    // perguntar se o usuário realmente quer voltar
    if(isFormTouched()) setState({...state, isDialogOpen: true})

    // Senão, pode voltar direto
    else history.goBack()
  }

  return (
    <>
      <h1>Cadastrar novo Carro</h1>

      <Snackbar
        open={isSnackOpen}
        autoHideDuration={6000}
        onClose={handleSnackClose}
        message={snackMessage}
        action={
          <Button color="secondary" size="small" onClick={handleSnackClose}>
            {isServerError ? 'Que pena!' : 'Entendi'}
          </Button>
        }
      />

      <ConfirmDialog
        title="ATENÇÃO: possível perda de dados"
        open={isDialogOpen}
        onClose={handleDialogClose}
      >
        Há dados ainda não salvos. Deseja realmente voltar?
      </ConfirmDialog>

      <form className={classes.form} onSubmit={handleSubmit}>
        
        <TextField 
          id="marca" 
          label="Marca" 
          variant="filled"
          value={carro.marca}
          required
          fullWidth
          placeholder="Informe a marca do carro"
          onChange={handleInputChange}
          helperText={errors?.marca}
          error={errors?.marca} 
        />

        <Toolbar className={classes.toolbar}>
          <Button
            variant="contained"
            color="secondary"
            type="submit"
            disabled={sendBtnLabel !== 'Enviar'}
          >
            {sendBtnLabel}
          </Button>
          <Button variant="outlined" onClick={handleBackBtnClick}>Voltar</Button>
        </Toolbar>
      
      </form>

      <div>
        {JSON.stringify(carro)}
      </div>

      <div>
        {'Formulário alterado: ' + isFormTouched()}
      </div>

    </>
  )
}