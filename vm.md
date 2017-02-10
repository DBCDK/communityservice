# Virtual environment

To purpose of running the project in a VM is to get as close to be able to automatically have the right dependencies installed and get as close to the production environment as possible.

## First time setup

For the virtual machine, you will need [Vagrant](https://www.vagrantup.com/) and [VirtualBox](https://www.virtualbox.org/).  On MacOS you can use [Homebrew Cask](https://caskroom.github.io/) for the installation:

    $ brew cask install virtualbox
    $ brew cask install vagrant

Then use `vagrant up` to create (and start) the VM.

## Development inside the VM

The usual cycle goes like

    $ vagrant up
    $ vagrant ssh
    vagrant@:~$ cd /vagrant
    vagrant@:/vagrant$ npm test
    vagrant@:/vagrant$ npm start
    vagrant@:/vagrant$ npm install --save spiffy-package

and so on.  The `src` directory is mounted at `/vagrant` inside the VM, so you make changes to the source code the way you usually do.

The scripts that set up the VM are mounted at `/provision` inside the VM, so you can test changes to the automated setup directly inside the VM, without having to start all over each time you tweak the VM.  But if you have to start over from a new VM, you do it from outside the VM:

    vagrant destroy
    rm -rf src/node_modules
    vagrant up

## Development outside the VM

For examples of how to run commands inside the VM from the outside, use commands like

    $ vagrant ssh -c "cd /vagrant; npm run alltests --silent"
    $ vagrant ssh -c "cd /vagrant; npm run unittest --silent"
    $ vagrant ssh -c "cd /vagrant; npm run integrationtest --silent"
    $ vagrant ssh -c "cd /vagrant; npm run coverage --silent"
