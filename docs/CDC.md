---

# Cahier des Charges

## Application Web : Guide Interactif de Configuration MikroTik

---

## 1. Présentation Générale

### 1.1. Contexte

Les administrateurs réseau et techniciens ont besoin d’un outil pédagogique et pratique pour configurer les routeurs MikroTik. L’application web proposée servira à la fois de guide didactique et d’interface de visualisation des commandes, permettant aux utilisateurs de suivre pas à pas la configuration tout en comprenant les concepts sous-jacents.

### 1.2. Objectifs

- Fournir un guide structuré et interactif pour la configuration complète d’un routeur MikroTik.
- Présenter les commandes en ligne de commande (CLI) et les équivalents en interface graphique (WinBox).
- Expliquer les terminologies et concepts clés.
- Proposer une interface moderne, responsive et accessible.
- Servir de support de formation et de documentation technique.



### 1.3. Public Cible

- Administrateurs réseaux débutants et intermédiaires
- Techniciens en infrastructure
- Étudiants en réseaux et télécommunications
- Formateurs en cybersécurité et administration système

---



## 2. Fonctionnalités Fonctionnelles



### 2.1. Architecture de l’Application

L’application sera une **Single Page Application (SPA)** légère, composée de :


| Composant                  | Description                                           |
| -------------------------- | ----------------------------------------------------- |
| **Barre de navigation**    | Accès rapide aux différentes sections                 |
| **Panneau latéral gauche** | Sommaire / Arborescence des étapes                    |
| **Panneau central**        | Contenu principal : explications, commandes, captures |
| **Panneau latéral droit**  | Glossaire dynamique / Aide contextuelle               |
| **Footer**                 | Mentions légales, version, liens utiles               |




### 2.2. Structure des Sections

L’application suivra l’ordre logique du processus de configuration :

#### 0. Introduction

- Objectifs du guide
- Prérequis matériels et logiciels
- Accès initial au routeur



#### 1. Prise en Main et Sécurisation

- Connexion initiale (WinBox / WebFig)
- Sécurisation contre force brute (SSH/WinBox)
  - Création d’utilisateur
  - Désactivation de l’utilisateur `admin`
  - Limitation des services
- Explication des terminologies : *force brute*, *service hardening*, *ACL*

