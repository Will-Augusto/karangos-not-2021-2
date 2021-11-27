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

const unidadesFed = [
  { sigla: 'DF', nome: 'Distrito Federal'},
  { sigla: 'ES', nome: 'Espírito Santo'},
  { sigla: 'GO', nome: 'Goiás'},
  { sigla: 'MS', nome: 'Mato Grosso do Sul'},
  { sigla: 'MG', nome: 'Minas Gerais'},
  { sigla: 'PR', nome: 'Paraná'},
  { sigla: 'RJ', nome: 'Rio de Janeiro'},
  { sigla: 'SP', nome: 'São Paulo' }
]

const formatChars = {
  '9': '[0-9]', // Entrada obrigatória
  '?': '[0-9]?' // Entrada opcional
}

export default function ClientesForm() {

  const classes = useStyles()
  const history = useHistory()

  const [state, setState] = React.useState({
    cliente: {},   // Objeto vazio
    errors: {},
    isFormValid: false,
    isSnackOpen: false,
    snackMessage: '',
    isServerError: false,
    sendBtnLabel: 'Enviar',
    isDialogOpen: false
  })
  const { cliente, errors, isFormValid, isSnackOpen, snackMessage, 
    isServerError, sendBtnLabel, isDialogOpen } = state

  function handleInputChange(event, field = event.target.id) {
    // Depuração
    console.log(event)

    // Preenche a variável de estado "cliente"
    // com os valores dos inputs
    const newCliente = {...cliente}

    if(field === 'data_nascimento') newCliente[field] = event
    else newCliente[field] = event.target.value

    // Chama a validação do formulário
    const newErrors = formValidate(newCliente)
    const newIsFormValid = Object.keys(newErrors).length === 0  // Sem erros
    
    setState({...state, cliente: newCliente, errors: newErrors, isFormValid: newIsFormValid})
  }

  function formValidate(fields) {

    const newErrors = {}

    // Validação do campo "nome": no mínimo 5 caracteres, devendo ter pelo
    // menos um espaço em branco entre eles
    if(!fields.nome || !(validator.isLength(fields.nome.trim(), {min: 5})
      && validator.contains(fields.nome.trim(), ' '))) {
      newErrors.nome = 'Informe o nome completo'
    }

    // Validação do campo "cpf": deve ser válido
    if(!fields.cpf || !cpfValidate(fields.cpf)) {
      newErrors.cpf = 'CPF inválido'
    }

    // Validação do campo "rg": no mínimo, 4 caracteres
    if(!fields.rg || !validator.isLength(fields.rg.trim(), {min: 4})) {
      newErrors.rg = 'Doc. identidade incompleto ou não informado'
    }

    // Validação do campo "data_nascimento": data deve ser válida e não pode ser futura
    if(!fields.data_nascimento || !dateIsValid(fields.data_nascimento) ||
      dateIsFuture(fields.data_nascimento)) {
      newErrors.data_nascimento = 'Data de nascimento inválida ou no futuro'
    }

    // Validação do campo "logradouro": no mínimo, 4 caracteres
    if(!fields.logradouro || !validator.isLength(fields.logradouro.trim(), {min: 4})) {
      newErrors.logradouro = 'Logradouro incompleto ou não informado'
    }

    // Validação do campo "num_imovel": no mínimo, 1 caracter
    if(!fields.num_imovel || !validator.isLength(fields.num_imovel.trim(), {min: 1})) {
      newErrors.num_imovel = 'Número do imóvel incompleto ou não informado'
    }

    // Validação do campo "bairro": no mínimo, 3 caracteres
    if(!fields.bairro || !validator.isLength(fields.bairro.trim(), {min: 3})) {
      newErrors.bairro = 'Bairro incompleto ou não informado'
    }

    // Validação do campo "município": no mínimo, 3 caracteres
    if(!fields.municipio || !validator.isLength(fields.municipio.trim(), {min: 3})) {
      newErrors.municipio = 'Município incompleto ou não informado'
    }

    // Validação do campo "uf": preenchido com EXATAMENTE 2 caracteres
    if(!fields.uf || !validator.isLength(fields.uf.trim(), {min: 2, max: 2})) {
      newErrors.uf = 'Selecione a UF'
    }

    // Validação do campo "telefone": não pode conter caracteres de sublinhado
    // (preenchimento incompleto)
    if(!fields.telefone || validator.contains(fields.telefone, '_')) {
      newErrors.telefone = 'Telefone incompleto ou não informado'
    }

    // Validação do campo "email": deve ser válido
    if(!fields.email || !validator.isEmail(fields.email)) {
      newErrors.email = 'Email inválido ou não informado'
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
    for(let field in cliente) {
      // Há pelo menos um campo com conteúdo
      if(cliente[field] !== '') return true
    }

    return false

  }

  function saveData() {

    // Muda o texto do botão de enviar e o desabilita, para evitar envios repetidos
    setState({...state, sendBtnLabel: 'Enviando...'})

    axios.post('https://api.faustocintra.com.br/clientes', cliente)
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
    if(!isServerError) history.push('/clientes')
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
      <h1>Cadastrar novo cliente</h1>

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
          id="nome" 
          label="Nome completo" 
          variant="filled"
          value={cliente.nome}
          required
          fullWidth
          placeholder="Informe o nome completo do cliente"
          onChange={handleInputChange}
          helperText={errors?.nome}
          error={errors?.nome} 
        />

        <InputMask
          mask="999.999.999-99"
          value={cliente.cpf}
          onChange={handleInputChange}
        >
          {
            () => <TextField 
              id="cpf" 
              label="CPF" 
              variant="filled"
              required
              fullWidth
              placeholder="Informe o CPF do cliente"
              helperText={errors?.cpf}
              error={errors?.cpf}               
            />
          }
        </InputMask>

        <TextField 
          id="rg" 
          label="Doc. Identidade" 
          variant="filled"
          value={cliente.rg}
          required
          fullWidth
          placeholder="Informe o documento de identidade do cliente"
          onChange={handleInputChange}
          helperText={errors?.rg}
          error={errors?.rg}

        />

        <LocalizationProvider dateAdapter={AdapterDateFns} locale={ptLocale}>
          <DatePicker
            label="Data de nascimento"
            value={cliente.data_nascimento}
            onChange={event => handleInputChange(event, 'data_nascimento')}
            renderInput={(params) => <TextField 
                {...params}
                id="data_nascimento"
                variant="filled"
                fullWidth
                helperText={errors?.data_nascimento}
                error={errors?.data_nascimento}
              />
            }
          />
        </LocalizationProvider>

        <TextField 
          id="logradouro" 
          label="Logradouro" 
          variant="filled"
          value={cliente.logradouro}
          required
          fullWidth
          placeholder="Rua, avenida, etc."
          onChange={handleInputChange}
          helperText={errors?.logradouro}
          error={errors?.logradouro} 
        />

        <TextField 
          id="num_imovel" 
          label="Número" 
          variant="filled"
          value={cliente.num_imovel}
          required
          fullWidth
          onChange={handleInputChange}
          helperText={errors?.num_imovel}
          error={errors?.num_imovel}
        />

        <TextField 
          id="complemento" 
          label="Complemento" 
          variant="filled"
          value={cliente.complemento}
          fullWidth
          placeholder="Apartamento, bloco, etc. (se necessário)"
          onChange={handleInputChange} 
        />

        <TextField 
          id="bairro" 
          label="Bairro" 
          variant="filled"
          value={cliente.bairro}
          required
          fullWidth
          onChange={handleInputChange}
          helperText={errors?.bairo}
          error={errors?.bairro}
        />

        <TextField 
          id="municipio" 
          label="Município" 
          variant="filled"
          value={cliente.municipio}
          required
          fullWidth
          onChange={handleInputChange} 
          helperText={errors?.municipio}
          error={errors?.municipio}
        />

        <TextField 
          id="uf" 
          label="UF" 
          variant="filled"
          value={cliente.uf}
          required
          fullWidth
          onChange={event => handleInputChange(event, 'uf')}
          select
          helperText={errors?.uf}
          error={errors?.uf} 
        > 
          {
            unidadesFed.map(uf => (
              <MenuItem key={uf.sigla} value={uf.sigla}>
                {uf.nome}
              </MenuItem>
            ))
          }
        </TextField> 

        <InputMask
          mask="(99) ?9999-9999"
          formatChars={formatChars}
          value={cliente.telefone}
          onChange={handleInputChange}
        >
          {
            () => <TextField 
              id="telefone" 
              label="Telefone" 
              variant="filled"
              required
              fullWidth
              placeholder="Informe o telefone do cliente"               
              helperText={errors?.telefone}
              error={errors?.telefone}
            />
          }
        </InputMask>  

        <TextField 
          id="email" 
          label="E-mail" 
          variant="filled"
          value={cliente.email}
          required
          fullWidth
          onChange={handleInputChange}
          helperText={errors?.email}
          error={errors?.email} 
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
        {JSON.stringify(cliente)}
      </div>

      <div>
        {'Formulário alterado: ' + isFormTouched()}
      </div>

    </>
  )
}